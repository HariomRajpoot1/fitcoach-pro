import React, { useEffect, useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import api, { setAuthToken } from './lib/api'

const STORAGE_KEY = 'fitcoach-pro-auth'

const assessmentSteps = [
  { key: 'gender', label: 'Gender', type: 'choice', options: ['Male', 'Female'] },
  { key: 'age', label: 'Age', type: 'number', placeholder: '28' },
  { key: 'heightCm', label: 'Height (cm)', type: 'number', placeholder: '175' },
  { key: 'weightKg', label: 'Weight (kg)', type: 'number', placeholder: '72' },
  {
    key: 'activityLevel',
    label: 'Activity Level',
    type: 'choice',
    options: ['Sedentary', 'Lightly Active', 'Active', 'Athlete'],
  },
  {
    key: 'goal',
    label: 'Goal',
    type: 'choice',
    options: ['Fat Loss', 'Lean Muscle Gain', 'Muscle Building', 'Body Recomposition'],
  },
  {
    key: 'dietPreference',
    label: 'Diet Preference',
    type: 'choice',
    options: ['Vegetarian', 'Non Vegetarian'],
  },
  {
    key: 'monthlyBudget',
    label: 'Monthly Food Budget',
    type: 'choice',
    options: ['Low Budget', 'Medium Budget', 'Premium Budget'],
  },
  {
    key: 'experience',
    label: 'Gym Experience',
    type: 'choice',
    options: ['Beginner', 'Intermediate', 'Advanced'],
  },
]

const initialAssessment = {
  gender: 'Male',
  age: '',
  heightCm: '',
  weightKg: '',
  activityLevel: 'Active',
  goal: 'Body Recomposition',
  dietPreference: 'Non Vegetarian',
  monthlyBudget: 'Medium Budget',
  experience: 'Beginner',
}

const testimonials = [
  {
    quote: 'The plan felt like it was built by a real coach, not a generic calculator.',
    name: 'Aarav S.',
    role: 'Product Designer',
  },
  {
    quote: 'My meals became simpler, cheaper, and more effective within the first week.',
    name: 'Nisha R.',
    role: 'Software Engineer',
  },
  {
    quote: 'The dashboard made it obvious what to do next every single day.',
    name: 'Kabir M.',
    role: 'Founder',
  },
]

function getInitialAuth() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : { token: '', user: null }
  } catch (error) {
    return { token: '', user: null }
  }
}

function App() {
  const [authMode, setAuthMode] = useState('register')
  const [authState, setAuthState] = useState(() => getInitialAuth())
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [assessment, setAssessment] = useState(initialAssessment)
  const [assessmentStep, setAssessmentStep] = useState(0)
  const [dashboard, setDashboard] = useState(null)
  const [isBooting, setIsBooting] = useState(true)
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false)
  const [isSubmittingAssessment, setIsSubmittingAssessment] = useState(false)
  const [isSubmittingProgress, setIsSubmittingProgress] = useState(false)
  const [progressForm, setProgressForm] = useState({
    week: '',
    weightKg: '',
    waistCm: '',
    energy: 'Good',
    adherence: 'On Track',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (authState.token) {
      setAuthToken(authState.token)
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(authState))
    } else {
      setAuthToken('')
      window.localStorage.removeItem(STORAGE_KEY)
    }
  }, [authState])

  useEffect(() => {
    async function bootstrap() {
      if (!authState.token) {
        setIsBooting(false)
        return
      }

      try {
        setAuthToken(authState.token)
        const response = await api.get('/profile/me')

        if (response.data.profile) {
          setDashboard(response.data.profile)
          setAssessment(response.data.profile.profile)
        }
      } catch (requestError) {
        setAuthState({ token: '', user: null })
        setError('Your session expired. Please sign in again.')
      } finally {
        setIsBooting(false)
      }
    }

    bootstrap()
  }, [])

  const currentStep = assessmentSteps[assessmentStep]
  const hasCompletedAssessment = Boolean(dashboard)
  const completionPercent = Math.round(((assessmentStep + 1) / assessmentSteps.length) * 100)

  const macroChartData = useMemo(() => {
    if (!dashboard) {
      return []
    }

    return [
      { name: 'Protein', value: dashboard.metrics.proteinGrams },
      { name: 'Carbs', value: dashboard.metrics.carbGrams },
      { name: 'Fat', value: dashboard.metrics.fatGrams },
    ]
  }, [dashboard])

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setError('')

    if (!authForm.email || !authForm.password || (authMode === 'register' && !authForm.name)) {
      setError('Please complete all required auth fields.')
      return
    }

    setIsSubmittingAuth(true)

    try {
      const endpoint = authMode === 'register' ? '/auth/register' : '/auth/login'
      const payload =
        authMode === 'register'
          ? authForm
          : { email: authForm.email, password: authForm.password }

      const response = await api.post(endpoint, payload)
      setAuthState({ token: response.data.token, user: response.data.user })
      setError('')
    } catch (requestError) {
      setError(
        requestError.response?.data?.message ||
          requestError.message ||
          'Unable to authenticate right now.'
      )
    } finally {
      setIsSubmittingAuth(false)
    }
  }

  function handleAssessmentChange(key, value) {
    setAssessment((current) => ({ ...current, [key]: value }))
  }

  function validateCurrentStep() {
    const value = assessment[currentStep.key]
    return value !== '' && value !== null && value !== undefined
  }

  async function handleAssessmentNext() {
    setError('')

    if (!validateCurrentStep()) {
      setError(`Please enter your ${currentStep.label.toLowerCase()}.`)
      return
    }

    if (assessmentStep < assessmentSteps.length - 1) {
      setAssessmentStep((step) => step + 1)
      return
    }

    setIsSubmittingAssessment(true)

    try {
      const response = await api.post('/profile/assessment', {
        ...assessment,
        age: Number(assessment.age),
        heightCm: Number(assessment.heightCm),
        weightKg: Number(assessment.weightKg),
      })

      setDashboard(response.data.dashboard)
      setProgressForm((current) => ({
        ...current,
        week: `Week ${response.data.dashboard.progressLogs.length + 1}`,
      }))
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to generate your plan.')
    } finally {
      setIsSubmittingAssessment(false)
    }
  }

  async function handleProgressSubmit(event) {
    event.preventDefault()
    setError('')

    if (!progressForm.week || !progressForm.weightKg) {
      setError('Week and body weight are required to log progress.')
      return
    }

    setIsSubmittingProgress(true)

    try {
      const response = await api.post('/progress', progressForm)
      setDashboard((current) => ({ ...current, progressLogs: response.data.progressLogs }))
      setProgressForm({
        week: `Week ${response.data.progressLogs.length + 1}`,
        weightKg: '',
        waistCm: '',
        energy: 'Good',
        adherence: 'On Track',
      })
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to save progress right now.')
    } finally {
      setIsSubmittingProgress(false)
    }
  }

  function logout() {
    setAuthState({ token: '', user: null })
    setDashboard(null)
    setAssessment(initialAssessment)
    setAssessmentStep(0)
  }

  if (isBooting) {
    return <LoadingScreen />
  }

  return (
    <div className="min-h-screen bg-ink text-white">
      <LandingHeader
        user={authState.user}
        hasDashboard={hasCompletedAssessment}
        onLogout={logout}
      />

      <main>
        <HeroSection />
        <BenefitsSection />
        <TestimonialsSection />

        <section id="plan" className="relative mx-auto max-w-7xl px-4 pb-24 pt-6 sm:px-6 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <AuthPanel
              authMode={authMode}
              authForm={authForm}
              error={error}
              isSubmitting={isSubmittingAuth}
              onFieldChange={setAuthForm}
              onModeChange={setAuthMode}
              onSubmit={handleAuthSubmit}
              user={authState.user}
            />

            {authState.user ? (
              hasCompletedAssessment ? (
                <Dashboard
                  dashboard={dashboard}
                  progressForm={progressForm}
                  setProgressForm={setProgressForm}
                  onProgressSubmit={handleProgressSubmit}
                  isSubmittingProgress={isSubmittingProgress}
                  macroChartData={macroChartData}
                />
              ) : (
                <AssessmentWizard
                  assessment={assessment}
                  completionPercent={completionPercent}
                  currentStep={currentStep}
                  error={error}
                  isSubmitting={isSubmittingAssessment}
                  stepIndex={assessmentStep}
                  totalSteps={assessmentSteps.length}
                  onBack={() => setAssessmentStep((step) => Math.max(0, step - 1))}
                  onChange={handleAssessmentChange}
                  onNext={handleAssessmentNext}
                />
              )
            ) : (
              <GuestPreview />
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function LandingHeader({ user, hasDashboard, onLogout }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <div>
          <p className="font-display text-xl font-bold tracking-wide text-sand">Hariom FitCoach Pro</p>
          <p className="text-sm text-white/60">AI-powered training, nutrition, and progress coaching</p>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 sm:inline-flex">
                {hasDashboard ? 'Plan Ready' : 'Assessment Pending'}
              </span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-white/15 px-4 py-2 text-sm text-white transition hover:border-ember hover:text-ember"
              >
                Logout
              </button>
            </>
          ) : (
            <a
              href="#plan"
              className="rounded-full bg-ember px-5 py-2 text-sm font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Create My Fitness Plan
            </a>
          )}
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,107,44,0.35),_transparent_30%),radial-gradient(circle_at_80%_20%,_rgba(140,240,192,0.22),_transparent_24%),linear-gradient(180deg,_rgba(16,48,71,0.94)_0%,_rgba(4,19,29,1)_70%)]" />
      <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-24 lg:pt-20">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full border border-ember/30 bg-ember/10 px-4 py-2 text-sm font-medium text-ember">
            Personalized Indian diet plans, gym programming, and progress tracking
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-tight text-sand sm:text-6xl">
            Train with a coach that adapts to your body, budget, and goals.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-white/75">
            FitCoach Pro builds your calories, macros, meals, and weekly training split in minutes,
            then turns it into a polished dashboard you can actually follow.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#plan"
              className="rounded-full bg-ember px-6 py-3 font-semibold text-white shadow-glow transition hover:-translate-y-0.5"
            >
              Create My Fitness Plan
            </a>
            <div className="rounded-full border border-white/15 px-6 py-3 text-white/70">
              Built for fat loss, muscle gain, and body recomposition
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ['Daily Calories', '2,240 kcal'],
            ['Protein Target', '154 g'],
            ['Plan Coverage', '7 Days'],
            ['Indian Meals', '6 Meals'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <p className="text-sm uppercase tracking-[0.2em] text-white/45">{label}</p>
              <p className="mt-8 font-display text-4xl font-bold text-sand">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function BenefitsSection() {
  const items = [
    {
      title: 'Assessment-led coaching',
      copy: 'Every plan starts with your age, body stats, activity, goal, diet style, food budget, and training experience.',
    },
    {
      title: 'Macro-smart nutrition',
      copy: 'Calories, protein, carbs, and fats are automatically calculated and mapped to common Indian foods.',
    },
    {
      title: 'Gym-ready programming',
      copy: 'Beginner, intermediate, and advanced weekly splits come with sets, reps, and rest times.',
    },
  ]

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {items.map((item) => (
          <article key={item.title} className="rounded-[28px] border border-white/10 bg-white/5 p-8">
            <p className="text-sm uppercase tracking-[0.24em] text-mint">{item.title}</p>
            <p className="mt-4 text-lg leading-8 text-white/75">{item.copy}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function TestimonialsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-[36px] border border-white/10 bg-white/5 p-8 sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-ember">Testimonials</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-sand">People stick with plans that feel personal.</h2>
          </div>
          <p className="max-w-xl text-white/65">
            Clear recommendations, realistic meals, and smart workout programming create the kind of momentum that lasts.
          </p>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <article key={testimonial.name} className="rounded-[28px] border border-white/10 bg-ink/40 p-6">
              <p className="text-lg leading-8 text-white/80">“{testimonial.quote}”</p>
              <p className="mt-8 font-semibold text-sand">{testimonial.name}</p>
              <p className="text-sm text-white/55">{testimonial.role}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function AuthPanel({
  authMode,
  authForm,
  error,
  isSubmitting,
  onFieldChange,
  onModeChange,
  onSubmit,
  user,
}) {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-glow sm:p-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-ember">Account</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-sand">
            {user ? `Welcome back, ${user.name}` : 'Start your coaching journey'}
          </h2>
        </div>
      </div>

      {!user ? (
        <>
          <div className="mt-6 inline-flex rounded-full border border-white/10 bg-ink/60 p-1">
            {['register', 'login'].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => onModeChange(mode)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  authMode === mode ? 'bg-ember text-white' : 'text-white/60'
                }`}
              >
                {mode === 'register' ? 'Create account' : 'Sign in'}
              </button>
            ))}
          </div>

          <form className="mt-6 space-y-4" onSubmit={onSubmit}>
            {authMode === 'register' ? (
              <Field
                label="Full Name"
                value={authForm.name}
                onChange={(value) => onFieldChange((current) => ({ ...current, name: value }))}
              />
            ) : null}

            <Field
              label="Email"
              type="email"
              value={authForm.email}
              onChange={(value) => onFieldChange((current) => ({ ...current, email: value }))}
            />
            <Field
              label="Password"
              type="password"
              value={authForm.password}
              onChange={(value) => onFieldChange((current) => ({ ...current, password: value }))}
            />

            {error ? <p className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-2xl bg-ember px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? 'Working...' : authMode === 'register' ? 'Create My Account' : 'Sign In'}
            </button>
          </form>
        </>
      ) : (
        <div className="mt-6 space-y-4">
          <div className="rounded-[24px] border border-mint/20 bg-mint/10 p-5 text-white/80">
            Your private coaching workspace is active. Complete the assessment to unlock your tailored nutrition and training plan.
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <StatChip label="Email" value={user.email} />
            <StatChip label="Status" value="Authenticated" />
          </div>
        </div>
      )}
    </section>
  )
}

function AssessmentWizard({
  assessment,
  completionPercent,
  currentStep,
  error,
  isSubmitting,
  stepIndex,
  totalSteps,
  onBack,
  onChange,
  onNext,
}) {
  const value = assessment[currentStep.key]

  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-mint">Assessment Wizard</p>
          <h2 className="mt-2 font-display text-3xl font-bold text-sand">Build your personal trainer profile</h2>
        </div>
        <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
          Step {stepIndex + 1} of {totalSteps}
        </span>
      </div>

      <div className="mt-6 h-2 rounded-full bg-white/10">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-ember to-mint transition-all"
          style={{ width: `${completionPercent}%` }}
        />
      </div>

      <div className="mt-8 rounded-[28px] border border-white/10 bg-ink/40 p-6">
        <p className="text-sm uppercase tracking-[0.22em] text-white/45">{currentStep.label}</p>
        <h3 className="mt-3 font-display text-3xl font-bold text-sand">
          {currentStep.type === 'choice'
            ? `Choose your ${currentStep.label.toLowerCase()}`
            : `Enter your ${currentStep.label.toLowerCase()}`}
        </h3>

        {currentStep.type === 'choice' ? (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {currentStep.options.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => onChange(currentStep.key, option)}
                className={`rounded-[24px] border px-5 py-5 text-left transition ${
                  value === option
                    ? 'border-ember bg-ember/15 text-white'
                    : 'border-white/10 bg-white/5 text-white/75 hover:border-white/30'
                }`}
              >
                <span className="font-semibold">{option}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-6">
            <input
              type="number"
              min="0"
              value={value}
              placeholder={currentStep.placeholder}
              onChange={(event) => onChange(currentStep.key, event.target.value)}
              className="w-full rounded-[22px] border border-white/10 bg-white/5 px-5 py-4 text-lg text-white outline-none ring-0 placeholder:text-white/25 focus:border-ember"
            />
          </div>
        )}
      </div>

      {error ? <p className="mt-4 rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      <div className="mt-6 flex flex-wrap justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={stepIndex === 0}
          className="rounded-full border border-white/15 px-5 py-3 text-white/70 transition hover:border-white/40 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={isSubmitting}
          className="rounded-full bg-ember px-6 py-3 font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Generating Plan...' : stepIndex === totalSteps - 1 ? 'Generate Dashboard' : 'Continue'}
        </button>
      </div>
    </section>
  )
}

function Dashboard({
  dashboard,
  progressForm,
  setProgressForm,
  onProgressSubmit,
  isSubmittingProgress,
  macroChartData,
}) {
  return (
    <section className="space-y-6">
      <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
        <p className="text-sm uppercase tracking-[0.22em] text-mint">Dashboard</p>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold text-sand">Your AI fitness command center</h2>
            <p className="mt-3 max-w-2xl text-white/65">
              Daily calories, macro targets, Indian meal structure, and a full weekly gym plan are all aligned to your assessment.
            </p>
          </div>
          <span className="rounded-full border border-mint/20 bg-mint/10 px-4 py-2 text-sm text-mint">
            Storage: {dashboard.storageMode}
          </span>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <MetricCard label="Fitness Score" value={`${dashboard.fitnessScore}/100`} tone="mint" />
          <MetricCard label="BMI" value={dashboard.metrics.bmi} tone="ember" />
          <MetricCard label="Daily Calories" value={`${dashboard.metrics.recommendedCalories} kcal`} tone="white" />
          <MetricCard label="Protein Target" value={`${dashboard.metrics.proteinGrams} g`} tone="white" />
          <MetricCard label="Hydration" value={`${dashboard.metrics.hydrationLiters} L`} tone="white" />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <SectionHeading eyebrow="Nutrition" title={dashboard.dietPlan.planName} description={dashboard.dietPlan.summary} />
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={macroChartData} dataKey="value" nameKey="name" outerRadius={96} fill="#ff6b2c">
                  {macroChartData.map((entry, index) => (
                    <CellColor key={entry.name} index={index} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-3">
            {dashboard.dietPlan.meals.map((meal) => (
              <div key={meal.name} className="rounded-[24px] border border-white/10 bg-ink/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-sand">{meal.name}</p>
                    <p className="mt-1 text-sm text-white/60">{meal.foods.join(' • ')}</p>
                  </div>
                  <p className="text-sm text-white/70">
                    {meal.calories} kcal • P {meal.protein}g • C {meal.carbs}g • F {meal.fat}g
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <SectionHeading eyebrow="Workout" title={dashboard.workoutPlan.planName} description={dashboard.workoutPlan.summary} />
          <div className="mt-6 space-y-4">
            {dashboard.workoutPlan.days.map((day) => (
              <div key={day.day} className="rounded-[24px] border border-white/10 bg-ink/40 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-xl font-bold text-sand">{day.day}</p>
                  <p className="text-sm uppercase tracking-[0.18em] text-mint">{day.focus}</p>
                </div>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-sm text-white/70">
                    <thead className="text-white/45">
                      <tr>
                        <th className="pb-2 pr-4 font-medium">Exercise</th>
                        <th className="pb-2 pr-4 font-medium">Sets</th>
                        <th className="pb-2 pr-4 font-medium">Reps</th>
                        <th className="pb-2 font-medium">Rest</th>
                      </tr>
                    </thead>
                    <tbody>
                      {day.exercises.map((exercise) => (
                        <tr key={exercise.name} className="border-t border-white/5">
                          <td className="py-3 pr-4">{exercise.name}</td>
                          <td className="py-3 pr-4">{exercise.sets}</td>
                          <td className="py-3 pr-4">{exercise.reps}</td>
                          <td className="py-3">{exercise.rest}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <SectionHeading eyebrow="Progress Tracker" title="Projected and logged progress" description="Track weight, waist, adherence, and recovery over time." />
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboard.progressLogs}>
                <defs>
                  <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6b2c" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff6b2c" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.45)" />
                <YAxis stroke="rgba(255,255,255,0.45)" />
                <Tooltip />
                <Area type="monotone" dataKey="weightKg" stroke="#ff6b2c" fillOpacity={1} fill="url(#colorWeight)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-6 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboard.progressLogs}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="week" stroke="rgba(255,255,255,0.45)" />
                <YAxis stroke="rgba(255,255,255,0.45)" />
                <Tooltip />
                <Bar dataKey="waistCm" fill="#8cf0c0" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-[32px] border border-white/10 bg-white/5 p-6">
          <SectionHeading eyebrow="Log Update" title="Add this week’s check-in" description="Keep the plan current with a quick weekly update." />
          <form className="mt-6 space-y-4" onSubmit={onProgressSubmit}>
            <Field label="Week Label" value={progressForm.week} onChange={(value) => setProgressForm((current) => ({ ...current, week: value }))} />
            <Field label="Weight (kg)" type="number" value={progressForm.weightKg} onChange={(value) => setProgressForm((current) => ({ ...current, weightKg: value }))} />
            <Field label="Waist (cm)" type="number" value={progressForm.waistCm} onChange={(value) => setProgressForm((current) => ({ ...current, waistCm: value }))} />
            <SelectField
              label="Energy"
              value={progressForm.energy}
              options={['Low', 'Good', 'Strong']}
              onChange={(value) => setProgressForm((current) => ({ ...current, energy: value }))}
            />
            <SelectField
              label="Adherence"
              value={progressForm.adherence}
              options={['Needs Work', 'On Track', 'Excellent']}
              onChange={(value) => setProgressForm((current) => ({ ...current, adherence: value }))}
            />
            <button
              type="submit"
              disabled={isSubmittingProgress}
              className="w-full rounded-2xl bg-ember px-5 py-4 font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingProgress ? 'Saving...' : 'Save Progress'}
            </button>
          </form>
        </div>
      </div>
    </section>
  )
}

function GuestPreview() {
  return (
    <section className="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
      <p className="text-sm uppercase tracking-[0.22em] text-mint">Preview</p>
      <h2 className="mt-2 font-display text-3xl font-bold text-sand">What unlocks after your assessment</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <PreviewCard title="Fitness Score + BMI" copy="See your current baseline and the energy target you should actually eat to." />
        <PreviewCard title="Diet Plan" copy="Six daily meals with Indian foods, macro targets, and budget-aware ingredient choices." />
        <PreviewCard title="Workout Plan" copy="A Monday-Sunday training split with exercises, sets, reps, and rest time guidance." />
        <PreviewCard title="Progress Tracker" copy="Visual charts for weight trend, waist reduction, energy, and adherence over time." />
      </div>
    </section>
  )
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink text-white">
      <div className="rounded-[28px] border border-white/10 bg-white/5 px-8 py-6 text-center">
        <p className="font-display text-2xl font-bold text-sand">FitCoach Pro</p>
        <p className="mt-2 text-white/65">Loading your coaching workspace...</p>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/70">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white outline-none placeholder:text-white/25 focus:border-ember"
      />
    </label>
  )
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-white/70">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white outline-none focus:border-ember"
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-ocean">
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function MetricCard({ label, value, tone }) {
  const toneClasses = {
    mint: 'border-mint/25 bg-mint/10 text-mint',
    ember: 'border-ember/25 bg-ember/10 text-ember',
    white: 'border-white/10 bg-ink/40 text-sand',
  }

  return (
    <article className={`rounded-[24px] border p-5 ${toneClasses[tone]}`}>
      <p className="text-sm uppercase tracking-[0.16em]">{label}</p>
      <p className="mt-5 font-display text-3xl font-bold">{value}</p>
    </article>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-ink/40 p-4">
      <p className="text-sm uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-2 text-white/80">{value}</p>
    </div>
  )
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div>
      <p className="text-sm uppercase tracking-[0.22em] text-ember">{eyebrow}</p>
      <h3 className="mt-2 font-display text-2xl font-bold text-sand">{title}</h3>
      <p className="mt-3 max-w-2xl text-white/60">{description}</p>
    </div>
  )
}

function PreviewCard({ title, copy }) {
  return (
    <article className="rounded-[24px] border border-white/10 bg-ink/40 p-5">
      <p className="font-semibold text-sand">{title}</p>
      <p className="mt-3 text-white/65">{copy}</p>
    </article>
  )
}

function CellColor({ index }) {
  const fills = ['#ff6b2c', '#8cf0c0', '#f5efe5']
  return <Cell fill={fills[index % fills.length]} />
}

export default App
