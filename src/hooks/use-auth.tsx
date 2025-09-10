import { createContext, useContext, useEffect, useState } from "react"
import { User, Session } from "@supabase/supabase-js"
import { supabase } from "@/integrations/supabase/client"

interface WorkerSession {
  id: string;
  name: string;
  email: string;
  role: string;
  shop_id: string | null;
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: any | null
  workerSession: WorkerSession | null
  isLoading: boolean
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  setWorkerSession: (session: WorkerSession | null) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<any | null>(null)
  const [workerSession, setWorkerSession] = useState<WorkerSession | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshProfile = async () => {
    if (!session?.user?.id) {
      setProfile(null)
      return
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle()
      
      if (error) {
        console.error('Error fetching profile:', error)
        setProfile(null)
      } else {
        setProfile(data)
      }
    } catch (error) {
      console.error('Error in profile fetch:', error)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeAuth = async () => {
      try {
        // Check for worker session first
        const storedWorkerSession = localStorage.getItem('workerSession')
        if (storedWorkerSession) {
          try {
            const parsedSession = JSON.parse(storedWorkerSession)
            if (mounted) {
              setWorkerSession(parsedSession)
              setIsLoading(false)
              return
            }
          } catch (error) {
            console.error('Error parsing worker session:', error)
            localStorage.removeItem('workerSession')
          }
        }

        // If no worker session, check for admin session
        const { data: { session: currentSession } } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (currentSession?.user) {
          setSession(currentSession)
          setUser(currentSession.user)
          
          // Fetch profile for admin users
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentSession.user.id)
            .maybeSingle()
          
          if (profileError) {
            console.error('Profile fetch error:', profileError)
          }
          
          if (mounted) {
            setProfile(profileData)
            setIsLoading(false)
          }
        } else {
          if (mounted) {
            setSession(null)
            setUser(null)
            setProfile(null)
            setIsLoading(false)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        if (mounted) {
          setIsLoading(false)
        }
      }
    }

    // Set up auth state listener for Supabase Auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        
        // Clear worker session when admin logs in
        if (session?.user) {
          setWorkerSession(null)
          localStorage.removeItem('workerSession')
        }
        
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // Fetch user profile
          await refreshProfile()
        } else {
          setProfile(null)
        }
        setIsLoading(false)
      }
    )

    // Initial auth initialization
    initializeAuth()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    try {
      // Clear worker session if exists
      if (workerSession) {
        setWorkerSession(null)
        localStorage.removeItem('workerSession')
      }
      
      // Sign out Supabase user if exists
      if (session?.user) {
        const { error } = await supabase.auth.signOut()
        if (error) {
          console.error('Sign out error:', error)
          throw error
        }
      }
      
      // Clear all state
      setUser(null)
      setSession(null)
      setProfile(null)
      setWorkerSession(null)
    } catch (error) {
      console.error('Error during sign out:', error)
      throw error
    }
  }

  const value = {
    user,
    session,
    profile,
    workerSession,
    isLoading,
    signOut,
    refreshProfile,
    setWorkerSession
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}