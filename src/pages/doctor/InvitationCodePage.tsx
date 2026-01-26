import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { generatePatientCode } from '../../services/api/dashboard.api';

export function InvitationCodePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateCode = async () => {
    if (!user?.id) return;

    setIsGeneratingCode(true);
    setError(null);
    setGeneratedCode(null);

    try {
      const code = await generatePatientCode(user.id);
      setGeneratedCode(code);
    } catch (err) {
      setError('Failed to generate patient code');
      console.error(err);
    } finally {
      setIsGeneratingCode(false);
    }
  };

  const handleCopyCode = () => {
    if (generatedCode) {
      navigator.clipboard.writeText(generatedCode);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Generate Invitation Code</h1>
            <p className="mt-1 text-sm text-slate-600">Create a code for new patient registration</p>
          </div>
          <button
            onClick={() => navigate('/doctor/patients')}
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Back to Patients
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Generate Code Card */}
        <div className="rounded-lg bg-white p-8 shadow-sm ring-1 ring-slate-200">
          <div className="text-center">
            <div className="mb-6 text-6xl">🔗</div>
            <h2 className="mb-4 text-2xl font-semibold">Patient Invitation Code</h2>
            <p className="mb-8 text-sm text-slate-600">
              Generate a unique code that patients can use to register and link to your account.
            </p>

            {!generatedCode ? (
              <button
                onClick={handleGenerateCode}
                disabled={isGeneratingCode}
                className="rounded-md bg-slate-900 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                {isGeneratingCode ? 'Generating...' : 'Generate Code'}
              </button>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border-2 border-slate-200 bg-slate-50 p-6">
                  <div className="mb-2 text-sm font-medium text-slate-600">Your Invitation Code</div>
                  <code className="block text-2xl font-mono font-bold text-slate-900">
                    {generatedCode}
                  </code>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleCopyCode}
                    className="flex-1 rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    📋 Copy Code
                  </button>
                  <button
                    onClick={handleGenerateCode}
                    disabled={isGeneratingCode}
                    className="flex-1 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                  >
                    Generate New Code
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  Share this code with your patient. They will use it during registration.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
