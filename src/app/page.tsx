'use client';
import { useState } from 'react';
import { Gift, Snowflake, ExternalLink } from 'lucide-react';

interface SecretSantaData {
  name: string;
  description: string;
  driveLink: string;
}

export default function Home() {
  // ... all your state declarations remain the same ...
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [secretSantaData, setSecretSantaData] = useState<SecretSantaData | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);

  // ... all your handlers remain the same ...
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/santa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          name, 
          password,
          action: 'create'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSecretSantaData(data);
        setIsSubmitted(true);
      } else {
        setErrorMessage(data.error || 'An unexpected error occurred.');
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password,
          action: 'check'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSecretSantaData(data);
        setIsSubmitted(true);
        setIsRechecking(false);
      } else {
        setErrorMessage(data.error || 'Invalid email or password.');
      }
    } catch (error) {
      console.error('Error:', error);
      setErrorMessage('Failed to connect to the server. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-red-100 to-green-100 p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 transform transition-all duration-500 ease-in-out hover:scale-105">
        <h1 className="text-4xl font-bold mb-8 text-center text-red-600">Secret Santa Name Generator</h1>

        {!isSubmitted ? (
          <>
            <form onSubmit={isRechecking ? handleRecheck : handleSubmit} className="space-y-6">
              {errorMessage && (
                <p className="text-red-500 text-sm bg-red-100 p-3 rounded">{errorMessage}</p>
              )}
              <div>
                <label htmlFor="email" className="block mb-2 font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border border-gray-300 rounded-md text-black focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="santa@northpole.com"
                />
              </div>

              {!isRechecking && (
                <div>
                  <label htmlFor="name" className="block mb-2 font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full p-3 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Kris Kringle"
                  />
                </div>
              )}

              <div>
                <label htmlFor="password" className="block mb-2 font-medium text-gray-700">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 border text-black border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className={`w-full bg-red-600 text-white p-3 rounded-md font-medium flex items-center justify-center space-x-2 hover:bg-red-700 transition-colors duration-300 ${
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
              {!isRechecking ? (
                <button
                  onClick={() => {
                    setIsRechecking(true);
                    setName('');
                    setErrorMessage('');
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Already registered? Check your assignment
                </button>
              ) : (
                <button
                  onClick={() => {
                    setIsRechecking(false);
                    setErrorMessage('');
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Need to register? Generate new assignment
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="text-center space-y-6">
            <h2 className="text-2xl font-bold mb-4 text-green-600">Your Secret Santa Assignment</h2>
            {secretSantaData && (
              <>
                <div className="space-y-4">
                  <p className="text-3xl font-bold bg-green-100 p-6 rounded-lg border-4 border-green-500 inline-block text-green-600">
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
                    <ExternalLink size={20} />
                    <span>View Image of the Person</span>
                  </a>
                </div>
                <p className="text-sm text-green-600">Happy gifting{name ? `, ${name}` : ''}!</p>
                <button
                  onClick={() => {
                    setIsSubmitted(false);
                    setSecretSantaData(null);
                    setEmail('');
                    setPassword('');
                    setName('');
                    setErrorMessage('');
                    setIsRechecking(false);
                  }}
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