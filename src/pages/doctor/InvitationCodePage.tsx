import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { generatePatientCode } from '../../services/api/dashboard.api';
import { Copy, RefreshCw, Users, Shield, CheckCircle, AlertCircle } from 'lucide-react';

export function InvitationCodePage() {
  const { user } = useAuth();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const handleGenerateCode = async () => {
    if (!user?.id) return;

    setIsGeneratingCode(true);
    setError(null);
    setGeneratedCode(null);
    setCopied(false);

    try {
      const code = await generatePatientCode(user.id);
      setGeneratedCode(code);
    } catch (err) {
      setError('Failed to generate patient code. Please try again.');
      console.error(err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = async () => {
    if (!generatedCode) return;

    try {
      await navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      setError('Failed to copy code to clipboard');
    }
  };

  const handleGenerateNew = async () => {
    if (generatedCode) {
      const confirmed = window.confirm(
        'Generating a new code will invalidate the previous one. Continue?'
      );
      if (confirmed) {
        await handleGenerateCode();
      }
    } else {
      await handleGenerateCode();
    }
  };

  const formatCode = (code: string) => {
    return code.match(/.{1,4}/g)?.join('-') || code;
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Invite Patient</h1>
            <p className="mt-2 text-gray-600">Generate a secure code for patient registration</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50 transition-all"
            >
              {showInstructions ? 'Hide Guide' : 'Show Instructions'}
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 border border-red-200 p-4 animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <p className="font-medium text-red-900">{error}</p>
              <button 
                onClick={handleGenerateCode}
                className="text-sm text-red-600 hover:text-red-800 mt-1"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

      {showInstructions && (
        <div className="mb-6 rounded-xl bg-blue-50 border border-blue-200 p-6 animate-slide-down">
          <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5" />
            How to Use Invitation Codes
          </h3>
          <ul className="space-y-3 text-blue-800">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold">1</span>
              </div>
              <span>Generate a unique invitation code below</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold">2</span>
              </div>
              <span>Share the code securely with your patient via email or in-person</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold">3</span>
              </div>
              <span>Patient uses the code during registration to link to your account</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold">4</span>
              </div>
              <span>Each code is single-use and expires after 7 days</span>
            </li>
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Generator Card */}
        <div className="lg:col-span-2">
          <div className="rounded-xl bg-white p-8 shadow-sm border border-gray-200">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                <Users className="w-10 h-10 text-blue-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Patient Invitation Code</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                Generate a unique, secure code that patients can use to register and automatically link to your practice.
              </p>

              {!generatedCode ? (
                <div className="space-y-6">
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-gray-900 to-gray-800 px-8 py-4 text-lg font-medium text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingCode ? (
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Generating Secure Code...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <RefreshCw className="w-5 h-5" />
                        Generate Invitation Code
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-600/0 to-purple-600/0 group-hover:from-blue-600/20 group-hover:to-purple-600/20 transition-all duration-300" />
                  </button>
                  
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <Shield className="w-4 h-4" />
                      Each code is encrypted and valid for 7 days
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-gray-200 p-8">
                      <div className="text-sm font-medium text-gray-600 mb-3 text-center">Your Invitation Code</div>
                      <div className="space-y-4">
                        <code className="block text-4xl font-mono font-bold text-gray-900 tracking-widest">
                          {formatCode(generatedCode)}
                        </code>
                        <div className="text-sm text-gray-500 text-center">
                          Expires in 7 days • Single use only
                        </div>
                      </div>
                    </div>
                    
                    {copied && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4 animate-slide-down">
                        <div className="flex items-center gap-3 justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-800 font-medium">Code copied to clipboard!</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={handleCopyCode}
                      className="group flex items-center justify-center gap-3 rounded-xl border-2 border-gray-300 bg-white px-6 py-4 text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-400 transition-all"
                    >
                      <Copy className="w-5 h-5" />
                      Copy Code
                    </button>
                    <button
                      onClick={handleGenerateNew}
                      disabled={isGeneratingCode}
                      className="group flex items-center justify-center gap-3 rounded-xl bg-gray-900 px-6 py-4 text-white font-medium hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Generate New
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Side Panel - Quick Tips */}
        <div className="space-y-6">
          {/* Security Info */}
          <div className="rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Security Features
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-800">128-bit encryption</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-800">Single use only</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-800">7-day expiration</span>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm text-blue-800">Patient verification</span>
              </li>
            </ul>
          </div>

          {/* Best Practices */}
          <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Best Practices</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Share Securely</p>
                  <p className="text-xs text-gray-600 mt-1">Use encrypted channels like secure email or in-person</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Monitor Usage</p>
                  <p className="text-xs text-gray-600 mt-1">Check when patients register with your code</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-gray-700">✓</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Generate as Needed</p>
                  <p className="text-xs text-gray-600 mt-1">Create codes only when expecting new patients</p>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl bg-gray-900 p-6 text-white">
            <h3 className="text-lg font-semibold mb-4">Invitation Stats</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Generated Today</span>
                <span className="text-sm font-medium">{generatedCode ? '1' : '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Active Codes</span>
                <span className="text-sm font-medium">{generatedCode ? '1' : '0'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Last Generated</span>
                <span className="text-sm font-medium">
                  {generatedCode ? 'Just now' : 'Never'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}