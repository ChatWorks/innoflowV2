import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Mail, Lock } from 'lucide-react';
import { InnoflowLogo } from '@/components/ui/InnoflowLogo';

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSignUp, setIsSignUp] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const [signInData, setSignInData] = useState({
    email: '',
    password: '',
  });

  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
  });

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const { error } = await signIn(signInData.email, signInData.password);
      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError('Ongeldige e-mail of wachtwoord. Controleer je gegevens en probeer opnieuw.');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Je e-mail is nog niet bevestigd. Controleer je inbox voor de bevestigingsmail.');
        } else {
          setError(error.message);
        }
      } else {
        // Successful login - the auth context will handle the redirect
      }
    } catch (error: any) {
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    if (signUpData.password !== signUpData.confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      setIsLoading(false);
      return;
    }

    if (signUpData.password.length < 6) {
      setError('Wachtwoord moet minimaal 6 karakters lang zijn.');
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName);
      if (error) {
        if (error.message.includes('User already registered')) {
          setError('Er bestaat al een account met dit e-mailadres. Probeer in te loggen.');
        } else if (error.message.includes('Password should be at least 6 characters')) {
          setError('Wachtwoord moet minimaal 6 karakters lang zijn.');
        } else {
          setError(error.message);
        }
      } else {
        setSuccess('Account succesvol aangemaakt! Controleer je e-mail voor de bevestigingslink.');
        setSignUpData({ email: '', password: '', confirmPassword: '', fullName: '' });
      }
    } catch (error: any) {
      setError('Er is een onverwachte fout opgetreden. Probeer het opnieuw.');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md border-0 shadow-lg">
        <CardContent className="p-8">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <InnoflowLogo size="lg" showText={false} />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Innoflow</h1>
            <h2 className="text-xl font-medium text-gray-900 mb-8">
              {isSignUp ? 'Account Aanmaken' : 'Welkom terug'}
            </h2>
          </div>

          {!isSignUp ? (
            /* Sign In Form */
            <form onSubmit={handleSignIn} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signin-email" className="text-sm font-medium text-gray-700">
                  E-mailadres
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="tijn@innoworks.ai"
                    value={signInData.email}
                    onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
                    className="pl-10 h-12 bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signin-password" className="text-sm font-medium text-gray-700">
                  Wachtwoord
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••••••"
                    value={signInData.password}
                    onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
                    className="pl-10 h-12 bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Inloggen...
                  </>
                ) : (
                  'Inloggen'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    console.log('Account aanmaken knop geklikt');
                    setError(null);
                    setSuccess(null);
                    setIsSignUp(true);
                    console.log('isSignUp staat nu op:', true);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Account Aanmaken
                </button>
              </div>
            </form>
          ) : (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-fullname" className="text-sm font-medium text-gray-700">
                  Volledige naam
                </Label>
                <Input
                  id="signup-fullname"
                  type="text"
                  placeholder="Jouw volledige naam"
                  value={signUpData.fullName}
                  onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                  className="h-12 bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                  E-mailadres
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="jouw.email@innoworks.ai"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    className="pl-10 h-12 bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                  Wachtwoord
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••••••"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    className="pl-10 h-12 bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-confirm-password" className="text-sm font-medium text-gray-700">
                  Bevestig wachtwoord
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="••••••••••••"
                    value={signUpData.confirmPassword}
                    onChange={(e) => setSignUpData({ ...signUpData, confirmPassword: e.target.value })}
                    className="pl-10 h-12 bg-blue-50 border-blue-100 focus:border-blue-300 focus:ring-blue-200"
                    required
                  />
                </div>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-lg" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Account aanmaken...
                  </>
                ) : (
                  'Account Aanmaken'
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setSuccess(null);
                    setIsSignUp(false);
                  }}
                  className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Al een account? Inloggen
                </button>
              </div>
            </form>
          )}

          {/* Footer Text */}
          <div className="text-center mt-8">
            <p className="text-xs text-gray-500">Voor Innoworks B.V. team toegang</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;