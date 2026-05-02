import { useEffect } from 'react'
import './LandingPage.css'

export default function LandingPage() {
  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal')
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), i * 80)
          }
        })
      },
      { threshold: 0.1 }
    )
    reveals.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* NAV */}
      <nav>
        <div className="nav-logo">Clinic<span>Flow</span></div>
        <ul className="nav-links">
          <li><a href="#how">How it Works</a></li>
          <li><a href="#features">Features</a></li>
          <li><a href="#pricing">Pricing</a></li>
          <li><a href="#signup" className="nav-cta">Get Started Free</a></li>
        </ul>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-badge">🌍 Built for African Healthcare</div>
        <h1>Your Clinic's Digital<br /><em>Booking System</em><br />in Minutes</h1>
        <p>ClinicFlow gives any private clinic or hospital their own branded appointment booking platform — with WhatsApp reminders, patient records, and admin dashboard. No IT team needed.</p>
        <div className="hero-actions">
          <a href="#signup" className="btn-primary">Start Free Trial →</a>
          <a href="#how" className="btn-ghost">See How It Works</a>
        </div>
        <div className="stats">
          <div className="stat">
            <div className="stat-num">2min</div>
            <div className="stat-label">Setup Time</div>
          </div>
          <div className="stat">
            <div className="stat-num">0</div>
            <div className="stat-label">Coding Required</div>
          </div>
          <div className="stat">
            <div className="stat-num">100%</div>
            <div className="stat-label">WhatsApp Native</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how" id="how">
        <div className="how-inner">
          <div className="how-header reveal">
            <div className="section-label">How It Works</div>
            <h2 className="section-title">From signup to <em>live</em> in under 5 minutes</h2>
          </div>
          <div className="steps">
            <div className="step reveal">
              <div className="step-num">01</div>
              <h3>Sign Up Your Clinic</h3>
              <p>Enter your clinic name, location, and contact details. Takes less than 2 minutes — no credit card required.</p>
            </div>
            <div className="step reveal">
              <div className="step-num">02</div>
              <h3>Add Your Doctors</h3>
              <p>Upload doctor profiles, specialties, and available time slots. Patients will see exactly who they're booking with.</p>
            </div>
            <div className="step reveal">
              <div className="step-num">03</div>
              <h3>Share Your Link</h3>
              <p>Get your unique booking page at clinicflow.ng/your-clinic. Share it on WhatsApp, Instagram, or your website.</p>
            </div>
            <div className="step reveal">
              <div className="step-num">04</div>
              <h3>Manage Everything</h3>
              <p>View all bookings in your admin dashboard. Patients get automatic WhatsApp reminders so they never miss an appointment.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features">
        <div className="features-inner">
          <div className="reveal">
            <div className="section-label">Features</div>
            <h2 className="section-title">Everything a Lagos clinic <em>actually needs</em></h2>
            <div className="features-list">
              <div className="feature-item">
                <div className="feature-icon">📅</div>
                <div>
                  <h4>Smart Appointment Booking</h4>
                  <p>Patients pick their doctor, date, and time in under 60 seconds. Works on any phone, no app download needed.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📲</div>
                <div>
                  <h4>WhatsApp Reminders</h4>
                  <p>Automatic WhatsApp messages sent to patients before every appointment. Reduce no-shows by up to 60%.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🏥</div>
                <div>
                  <h4>Your Own Branded Page</h4>
                  <p>A beautiful booking page with your clinic's name, doctors, and branding — not a generic form.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div>
                  <h4>Admin Dashboard</h4>
                  <p>See all bookings, manage appointments, track patient flow, and export reports — all in one place.</p>
                </div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <div>
                  <h4>Works on Low Internet</h4>
                  <p>Designed for Nigerian network conditions. Fast, lightweight, and works even on 2G connections.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="features-mockup reveal">
            <div className="mockup-header">
              <div className="mockup-logo">Clinic<span>Flow</span></div>
              <div className="mockup-badge">● Live</div>
            </div>
            <p style={{ fontSize: '12px', color: '#4CAF82', marginBottom: '16px', fontWeight: 600 }}>CHOOSE A DOCTOR</p>
            <div className="mockup-doctor">
              <div className="mockup-avatar" style={{ background: '#2D6A4F' }}>AO</div>
              <div>
                <div className="mockup-doctor-name">Dr. Adaeze Okafor</div>
                <div className="mockup-doctor-spec">General Practice · 5 slots today</div>
              </div>
            </div>
            <div className="mockup-doctor">
              <div className="mockup-avatar" style={{ background: '#1B4965' }}>EN</div>
              <div>
                <div className="mockup-doctor-name">Dr. Emeka Nwosu</div>
                <div className="mockup-doctor-spec">Cardiology · 4 slots today</div>
              </div>
            </div>
            <div className="mockup-doctor">
              <div className="mockup-avatar" style={{ background: '#6B2D8B' }}>FB</div>
              <div>
                <div className="mockup-doctor-name">Dr. Fatima Bello</div>
                <div className="mockup-doctor-spec">Paediatrics · 4 slots today</div>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#4CAF82', margin: '16px 0 8px', fontWeight: 600 }}>SELECT TIME</p>
            <div className="mockup-slots">
              <div className="mockup-slot">09:00</div>
              <div className="mockup-slot active">10:30</div>
              <div className="mockup-slot">11:00</div>
              <div className="mockup-slot">14:00</div>
              <div className="mockup-slot">15:30</div>
              <div className="mockup-slot">16:00</div>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing" id="pricing">
        <div className="pricing-inner">
          <div className="section-label reveal">Pricing</div>
          <h2 className="section-title reveal">Simple, honest pricing<br />for African clinics</h2>
          <p className="pricing-subtitle reveal">Start free. Upgrade when you're ready. Cancel anytime.</p>
          <div className="pricing-cards">
            <div className="pricing-card reveal">
              <div className="plan-name">Starter</div>
              <div className="price-amount">Free</div>
              <div className="price-period">forever · up to 30 bookings/month</div>
              <ul className="price-features">
                <li>1 clinic page</li>
                <li>Up to 3 doctors</li>
                <li>Appointment booking</li>
                <li>Basic admin dashboard</li>
                <li>Email support</li>
              </ul>
              <a href="#signup" className="btn-plan btn-plan-outline">Get Started Free</a>
            </div>
            <div className="pricing-card featured reveal">
              <div className="plan-name" style={{ color: '#0B1F13' }}>Growth</div>
              <div className="price-amount">₦15,000</div>
              <div className="price-period">/month · unlimited bookings</div>
              <ul className="price-features">
                <li>Unlimited bookings</li>
                <li>Unlimited doctors</li>
                <li>WhatsApp reminders</li>
                <li>Patient records</li>
                <li>Advanced analytics</li>
                <li>Priority support</li>
              </ul>
              <a href="#signup" className="btn-plan btn-plan-solid">Start 14-Day Trial</a>
            </div>
            <div className="pricing-card reveal">
              <div className="plan-name">Enterprise</div>
              <div className="price-amount">₦45,000</div>
              <div className="price-period">/month · multi-branch</div>
              <ul className="price-features">
                <li>Multiple branches</li>
                <li>Custom domain</li>
                <li>HMO integration</li>
                <li>Custom branding</li>
                <li>Dedicated support</li>
                <li>API access</li>
              </ul>
              <a href="#signup" className="btn-plan btn-plan-outline">Contact Sales</a>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials">
        <div className="testimonials-inner">
          <div className="testimonials-header reveal">
            <div className="section-label">Testimonials</div>
            <h2 className="section-title">Trusted by clinics<br />across <em>Lagos</em></h2>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial reveal">
              <p className="testimonial-quote">"We set up ClinicFlow in one afternoon. Our patients now book on WhatsApp and we get zero no-shows. It's transformed how we run appointments."</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: '#2D6A4F' }}>NK</div>
                <div>
                  <div className="author-name">Dr. Ngozi Kalu</div>
                  <div className="author-title">Medical Director, Kalu Health Centre, Lekki</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal">
              <p className="testimonial-quote">"Before ClinicFlow, we were managing appointments in a notebook. Now everything is digital, our patients get reminders, and our receptionist has half the work."</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: '#1B4965' }}>TA</div>
                <div>
                  <div className="author-name">Tunde Adesanya</div>
                  <div className="author-title">Practice Manager, Adesanya Specialist Clinic, VI</div>
                </div>
              </div>
            </div>
            <div className="testimonial reveal">
              <p className="testimonial-quote">"The WhatsApp integration alone is worth it. Nigerian patients are on WhatsApp all day — meeting them there was the smartest thing we did."</p>
              <div className="testimonial-author">
                <div className="author-avatar" style={{ background: '#8B2D2D' }}>FO</div>
                <div>
                  <div className="author-name">Dr. Funke Osei</div>
                  <div className="author-title">Founder, Little Stars Paediatric Clinic, Ikeja</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta" id="signup">
        <h2>Ready to digitise<br />your clinic?</h2>
        <p>Join hundreds of Lagos clinics already on ClinicFlow.<br />Free to start. No credit card needed.</p>
        <a href="#" className="btn-dark">Create Your Clinic Page →</a>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-logo">Clinic<span>Flow</span></div>
        <p>Built for Lagos Private Healthcare · ©️ 2026 ClinicFlow</p>
        <p style={{ color: '#4CAF82', fontSize: '13px' }}>hello@clinicflow.ng</p>
      </footer>
    </>
  )
}