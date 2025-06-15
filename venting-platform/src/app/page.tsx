// src/app/page.tsx
import Link from 'next/link';

// Example Feature Card component (can be inlined or separate)
const FeatureCard = ({ title, description, icon }: {title: string, description: string, icon: string }) => (
  <div className="bg-white dark:bg-neutral-dark p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
    <div className="text-3xl mb-4 text-calm-purple">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-neutral-darker dark:text-neutral-light">{title}</h3>
    <p className="text-neutral-dark dark:text-neutral-DEFAULT">{description}</p>
  </div>
);

export default function LandingPage() {
  return (
    <>
      {/* Hero Section - Apply dark mode styles */}
      <section className="text-center py-20 bg-gradient-to-r from-calm-blue-light via-calm-purple-light to-neutral-light dark:from-calm-blue-dark dark:via-calm-purple-dark dark:to-neutral-darker">
        <div className="container mx-auto px-6">
          <h1 className="text-5xl md:text-6xl font-bold text-neutral-darker dark:text-neutral-light mb-6">
            Share Your Thoughts. <span className="text-calm-purple dark:text-calm-purple-light">Anonymously.</span>
          </h1>
          <p className="text-xl text-neutral-dark dark:text-neutral-DEFAULT mb-10 max-w-2xl mx-auto">
            A safe and supportive community for university students to express themselves freely without judgment.
          </p>
          <Link
            href="/vents/new" // Changed from /feed to /vents/new as per previous step
            className="bg-calm-purple hover:bg-calm-purple-dark text-white font-bold py-4 px-10 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
          >
            Start Venting Anonymously
          </Link>
        </div>
      </section>

      {/* Features Overview Section */}
      <section id="features" className="py-16 bg-neutral-light dark:bg-dark-card">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-darker dark:text-neutral-light mb-12">
            Why VentSpace?
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard icon="🤫" title="Total Anonymity" description="Share without revealing your identity. Your privacy is paramount." />
            <FeatureCard icon="💖" title="Supportive Community" description="Connect with peers who understand. Give and receive support." />
            <FeatureCard icon="🏷️" title="Emotion Tagging" description="Categorize your vents by emotion and topic for better connection." />
            <FeatureCard icon="🔒" title="Safe & Secure" description="We prioritize your safety with robust moderation and data protection." />
            <FeatureCard icon="📱" title="Cross-Platform" description="Access VentSpace on any device, anytime, anywhere." />
            <FeatureCard icon="🌙" title="Dark Mode" description="Easy on the eyes, perfect for late-night venting sessions." />
          </div>
        </div>
      </section>

      {/* Testimonials Section (Placeholder) */}
      <section id="testimonials" className="py-16 bg-white dark:bg-dark-bg">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-darker dark:text-neutral-light mb-12">What Students Say</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1,2,3].map(i => (
              <div key={i} className="bg-neutral-light dark:bg-dark-card p-6 rounded-lg shadow-lg">
                <p className="italic text-neutral-dark dark:text-neutral-DEFAULT">"VentSpace has been a lifesaver during stressful exam periods. It's great to know I'm not alone."</p>
                <p className="mt-4 font-semibold text-calm-blue-dark dark:text-calm-blue-light">- Student User {i}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots/Mockups Section (Placeholder) */}
      <section id="screenshots" className="py-16 bg-neutral-light dark:bg-dark-card">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-darker dark:text-neutral-light mb-12">See It In Action</h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="bg-neutral-DEFAULT dark:bg-neutral-darker h-64 rounded-lg shadow-md flex items-center justify-center text-neutral-dark dark:text-neutral-DEFAULT">App Screenshot 1 (Placeholder)</div>
            <div className="bg-neutral-DEFAULT dark:bg-neutral-darker h-64 rounded-lg shadow-md flex items-center justify-center text-neutral-dark dark:text-neutral-DEFAULT">App Screenshot 2 (Placeholder)</div>
          </div>
        </div>
      </section>

      {/* Trust/Safety Section */}
      <section id="trust" className="py-16 bg-white dark:bg-dark-bg">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-neutral-darker dark:text-neutral-light mb-8">
            Your Safety is Our Priority
          </h2>
          <p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT mb-4">
            We are committed to creating a safe, respectful, and anonymous environment. Our platform includes features like content reporting and moderation (details coming soon) to ensure a positive experience for everyone.
          </p>
          <p className="text-lg text-neutral-dark dark:text-neutral-DEFAULT">
            Your data is handled with care. We only store what's necessary for the platform to function and are transparent about our data practices. For more details, please see our (future) Privacy Policy.
          </p>
        </div>
      </section>
    </>
  );
}
