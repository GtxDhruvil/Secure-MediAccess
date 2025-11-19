import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, FileText, Lock, CheckCircle, ArrowRight } from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Shield,
      title: 'Secure Access Control',
      description: 'OTP-based verification ensures only authorized personnel can access medical records.'
    },
    {
      icon: Lock,
      title: 'End-to-End Encryption',
      description: 'AES-256 encryption protects sensitive medical data both in transit and at rest.'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Separate dashboards for patients and doctors with appropriate permissions.'
    },
    {
      icon: FileText,
      title: 'Comprehensive Audit Trail',
      description: 'Track every access, modification, and action for compliance and security.'
    }
  ];

  const benefits = [
    'Patient data ownership and control',
    'Real-time consent management',
    'HIPAA compliance ready',
    'Secure file uploads and downloads',
    'Mobile-responsive design',
    '24/7 system monitoring'
  ];

  return (
    <div className="min-h-screen bg-transparent text-white">
      {/* Header */}
      <header className="bg-slate-900/70 backdrop-blur-sm border-b border-slate-700 shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Shield className="h-8 w-8 text-blue-400 mr-3" />
              <h1 className="text-2xl font-bold text-gray-100">Secure Medical Access</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/login"
                className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600 transition-colors duration-200"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Secure Medical Records
            <span className="block text-blue-400">Patient-Controlled Access</span>
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-3xl mx-auto">
            A revolutionary medical record system that puts patients in control of their data 
            while providing healthcare providers secure, OTP-verified access when needed.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-600 transition-colors duration-200 flex items-center justify-center shadow-lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link
              to="/about"
              className="bg-slate-700/50 border border-slate-600 text-slate-200 px-8 py-3 rounded-lg text-lg font-medium hover:bg-slate-600/50 transition-colors duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-4">
              Advanced Security Features
            </h2>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Built with healthcare security standards in mind, ensuring your medical data 
              remains private and accessible only to authorized personnel.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 bg-slate-800/50 rounded-lg shadow-lg card-glow">
                <div className="mx-auto h-16 w-16 bg-slate-700/70 rounded-full flex items-center justify-center mb-4 border border-slate-600">
                  <feature.icon className="h-8 w-8 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-400">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-transparent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-white mb-6">
                Why Choose Secure Medical Access?
              </h2>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start">
                    <CheckCircle className="h-6 w-6 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-slate-300">{benefit}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8">
                <Link
                  to="/register"
                  className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-500 hover:bg-blue-600 transition-colors duration-200 shadow-lg"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </div>
            </div>
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 p-8 rounded-lg shadow-2xl">
              <h3 className="text-xl font-semibold text-white mb-4">
                System Overview
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-slate-400">Data Encryption</span>
                  <span className="font-medium text-green-400">AES-256</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Access Control</span>
                  <span className="font-medium text-green-400">OTP + Role-based</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Compliance</span>
                  <span className="font-medium text-green-400">HIPAA Ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Uptime</span>
                  <span className="font-medium text-green-400">99.9%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-500/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Secure Your Medical Records?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of healthcare providers and patients who trust our secure 
            medical record system for their data protection needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/register"
              className="bg-white text-blue-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors duration-200 shadow-lg"
            >
              Start Free Trial
            </Link>
            <Link
              to="/contact"
              className="border border-blue-200 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-blue-400/50 transition-colors duration-200"
            >
              Contact Sales
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900/80 backdrop-blur-sm text-white py-12 border-t border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <Shield className="h-8 w-8 text-blue-400 mr-3" />
                <span className="text-xl font-bold">Secure Medical Access</span>
              </div>
              <p className="text-slate-400">
                Empowering patients with control over their medical data while 
                providing healthcare providers secure access.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-200">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="/security" className="hover:text-white transition-colors">Security</Link></li>
                <li><Link to="/compliance" className="hover:text-white transition-colors">Compliance</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-200">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-slate-200">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/help" className="hover:text-white transition-colors">Help Center</Link></li>
                <li><Link to="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="/status" className="hover:text-white transition-colors">System Status</Link></li>
                <li><Link to="/contact" className="hover:text-white transition-colors">Contact Support</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-500">
            <p>&copy; 2024 Secure Medical Access. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;








