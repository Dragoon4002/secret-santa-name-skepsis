'use client';
import { useState } from 'react';
import { Gift, Snowflake, ExternalLink } from 'lucide-react';

interface SecretSantaData {
  name: string;
  description: string;
  driveLink: string;
}

interface ApiResponse {
  error?: string;
  name?: string;
  description?: string;
  driveLink?: string;
}

interface FormState {
  email: string;
  name: string;
  password: string;
}

export default function Home() {
  const [formData, setFormData] = useState<FormState>({
    email: '',
    name: '',
    password: ''
  });
  const [secretSantaData, setSecretSantaData] = useState<SecretSantaData | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/santa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          name: formData.name.trim(),
          password: formData.password.trim(),
          action: 'create'
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        let displayError = data.error || 'An unexpected error occurred.';
        switch (response.status) {
          case 400:
            if (data.error?.includes('already been assigned')) {
              displayError = 'This email is already registered. Please use "Check Assignment" instead.';
            }
            break;
          case 404:
            displayError = 'All names have been assigned. Please contact the organizer.';
            break;
        }
        setErrorMessage(displayError);
        return;
      }

      if (data.name && data.description && data.driveLink) {
        setSecretSantaData({
          name: data.name,
          description: data.description,
          driveLink: data.driveLink
        });
        setIsSubmitted(true);
      } else {
        setErrorMessage('Invalid response from server');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/santa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim(),
          action: 'check'
        }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        let displayError = data.error || 'Invalid email or password.';
        switch (response.status) {
          case 401:
            displayError = 'Invalid email or password. Please try again.';
            break;
          case 400:
            displayError = 'Please enter both email and password.';
            break;
        }
        setErrorMessage(displayError);
        return;
      }

      if (data.name && data.description && data.driveLink) {
        setSecretSantaData({
          name: data.name,
          description: data.description,
          driveLink: data.driveLink
        });
        setIsSubmitted(true);
        setIsRechecking(false);
      } else {
        setErrorMessage('Invalid response from server');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ email: '', name: '', password: '' });
    setSecretSantaData(null);
    setIsSubmitted(false);
    setErrorMessage('');
    setIsRechecking(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-100 to-green-100 p-4 md:p-8 flex items-center justify-center">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6 md:p-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-center text-red-600">
          Secret Santa Name Generator
        </h1>

        {!isSubmitted ? (
          <>
            <form onSubmit={isRechecking ? handleRecheck : handleSubmit} className="space-y-6">
              {errorMessage && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                  <span className="block sm:inline">{errorMessage}</span>
                  <button
                    type="button"
                    className="absolute top-0 bottom-0 right-0 px-4 py-3"
                    onClick={() => setErrorMessage('')}
                  >
                    <span className="text-2xl">&times;</span>
                  </button>
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="santa@northpole.com"
                />
              </div>

              {!isRechecking && (
                <div>
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="name">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Kris Kringle"
                  />
                </div>
              )}

              <div>
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                  minLength={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-red-600 text-white py-2 px-4 rounded-md font-medium flex items-center justify-center space-x-2 hover:bg-red-700 transition-colors duration-300 ${
                  isLoading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isLoading ? (
                  <>
                    <Snowflake className="animate-spin" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <>
                    <Gift />
                    <span>{isRechecking ? 'Check Assignment' : 'Generate Secret Santa Name'}</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsRechecking(!isRechecking);
                  setFormData(prev => ({ ...prev, name: '' }));
                  setErrorMessage('');
                }}
                className="text-blue-600 hover:text-blue-800 underline"
              >
                {!isRechecking
                  ? 'Already registered? Check your assignment'
                  : 'Need to register? Generate new assignment'}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold text-green-600">Your Secret Santa Assignment</h2>
            {secretSantaData && (
              <>
                <div className="space-y-4">
                  <p className="text-2xl font-bold bg-green-100 p-4 rounded-lg border-2 border-green-500 inline-block text-green-600">
                    {secretSantaData.name}
                  </p>
                  <p className="text-lg text-gray-700 italic">
                    &ldquo;{secretSantaData.description}&rdquo;
                  </p>
                  <a
                    href={secretSantaData.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-5 w-5" />
                    <span>View Image of the Person</span>
                  </a>
                </div>
                <p className="text-sm text-green-600">
                  Happy gifting{formData.name ? `, ${formData.name}` : ''}!
                </p>
                <button
                  onClick={resetForm}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Start Over
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}