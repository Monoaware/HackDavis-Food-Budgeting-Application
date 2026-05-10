import { useState } from 'react'
import LoginForm from '../components/auth/LoginForm'
import SignupForm from '../components/auth/SignupForm'
import '../styles/auth.css'

type Tab = 'login' | 'signup'

interface Props {
  onSuccess: (token: string) => void
}

export default function AuthPage({ onSuccess }: Props) {
  const [tab, setTab] = useState<Tab>('login')
  const [justSignedUp, setJustSignedUp] = useState(false)

  function handleSignedUp() {
    setJustSignedUp(true)
    setTab('login')
  }

  return (
    <div className="auth-layout">
      <div className="panel-left">
        <PanelDecoration />

        <div className="panel-top">
          <div className="logo-mark">
            <svg className="logo-icon" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 6C28 6 14 7 9 18C6 25 10 30 18 28C26 26 30 14 28 6Z" fill="rgba(250,248,243,0.85)"/>
              <line x1="18" y1="28" x2="14" y2="34" stroke="rgba(250,248,243,0.5)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="logo-name">FreshBudget</span>
          </div>
        </div>

        <div className="panel-bottom">
          <h2 className="panel-headline">
            Eat well.<br /><em>Spend</em><br />less.
          </h2>
          <p className="panel-tagline">Smart meal planning for real budgets.</p>
        </div>
      </div>

      <div className="panel-right">
        <div className="form-container">
          <div className={`tabs${tab === 'signup' ? ' on-signup' : ''}`}>
            <div className="tab-indicator" />
            <button
              className={`tab-btn${tab === 'login' ? ' active' : ''}`}
              onClick={() => setTab('login')}
            >
              Sign in
            </button>
            <button
              className={`tab-btn${tab === 'signup' ? ' active' : ''}`}
              onClick={() => setTab('signup')}
            >
              Create account
            </button>
          </div>

          {tab === 'login'
            ? <LoginForm key="login" onSuccess={onSuccess} successMessage={justSignedUp ? 'Account created! Sign in to continue.' : undefined} />
            : <SignupForm key="signup" onSignedUp={handleSignedUp} />
          }
        </div>
      </div>
    </div>
  )
}

function PanelDecoration() {
  return (
    <svg className="deco" viewBox="0 0 560 900" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
      <circle cx="420" cy="200" r="260" fill="none" stroke="rgba(250,248,243,0.05)" strokeWidth="1"/>
      <circle cx="420" cy="200" r="190" fill="none" stroke="rgba(250,248,243,0.05)" strokeWidth="1"/>
      <circle cx="420" cy="200" r="120" fill="rgba(250,248,243,0.03)"/>
      <ellipse cx="80"  cy="650" rx="160" ry="160" fill="rgba(250,248,243,0.03)"/>
      <ellipse cx="500" cy="780" rx="120" ry="120" fill="rgba(250,248,243,0.03)"/>
      <g transform="translate(110,320) rotate(-8)" opacity="0.18">
        <line x1="0" y1="0" x2="0" y2="280" stroke="#FAF8F3" strokeWidth="1.2"/>
        <ellipse cx="-13" cy="55"  rx="7"  ry="19" fill="#FAF8F3" transform="rotate(-28,-13,55)"/>
        <ellipse cx="13"  cy="110" rx="7"  ry="19" fill="#FAF8F3" transform="rotate(28,13,110)"/>
        <ellipse cx="-13" cy="165" rx="6"  ry="17" fill="#FAF8F3" transform="rotate(-28,-13,165)"/>
        <ellipse cx="13"  cy="215" rx="6"  ry="17" fill="#FAF8F3" transform="rotate(28,13,215)"/>
        <ellipse cx="0"   cy="0"   rx="9"  ry="24" fill="#FAF8F3"/>
      </g>
      <g transform="translate(480,380) rotate(12)" opacity="0.13">
        <line x1="0" y1="0" x2="0" y2="230" stroke="#FAF8F3" strokeWidth="1.2"/>
        <ellipse cx="-11" cy="50"  rx="6"  ry="16" fill="#FAF8F3" transform="rotate(-25,-11,50)"/>
        <ellipse cx="11"  cy="100" rx="6"  ry="16" fill="#FAF8F3" transform="rotate(25,11,100)"/>
        <ellipse cx="-11" cy="150" rx="5"  ry="14" fill="#FAF8F3" transform="rotate(-25,-11,150)"/>
        <ellipse cx="0"   cy="0"   rx="8"  ry="20" fill="#FAF8F3"/>
      </g>
      <g transform="translate(60,720) rotate(5)" opacity="0.09">
        <ellipse cx="0"   cy="0"  rx="36" ry="75" fill="#FAF8F3"/>
        <ellipse cx="45"  cy="15" rx="30" ry="62" fill="#FAF8F3" transform="rotate(22,45,15)"/>
        <ellipse cx="-38" cy="15" rx="28" ry="58" fill="#FAF8F3" transform="rotate(-22,-38,15)"/>
      </g>
      <circle cx="75"  cy="220" r="4"   fill="rgba(201,95,42,0.7)"/>
      <circle cx="510" cy="560" r="3"   fill="rgba(201,95,42,0.5)"/>
      <circle cx="175" cy="780" r="5"   fill="rgba(196,150,58,0.45)"/>
      <circle cx="450" cy="830" r="3"   fill="rgba(196,150,58,0.5)"/>
      <circle cx="310" cy="100" r="2.5" fill="rgba(201,95,42,0.4)"/>
      <line x1="60" y1="860" x2="240" y2="860" stroke="rgba(250,248,243,0.12)" strokeWidth="1"/>
    </svg>
  )
}
