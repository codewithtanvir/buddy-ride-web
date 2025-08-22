import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  MapPin,
  MessageCircle,
  Shield,
  DollarSign,
  ArrowRight,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  Sparkles,
  UserCheck,
  Navigation,
  Mail,
} from "lucide-react";
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 md:w-10 h-8 md:h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                <Car className="h-4 md:h-6 w-4 md:w-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Buddy Ride
                </h1>
                <p className="text-xs text-gray-500 hidden sm:block">AIUB Student Transport</p>
              </div>
            </div>
            <Button
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl px-4 md:px-6 py-2 shadow-lg transition-all duration-200 text-sm md:text-base"
            >
              <span className="hidden sm:inline">Get Started</span>
              <span className="sm:hidden">Start</span>
              <ArrowRight className="h-4 w-4 ml-1 md:ml-2" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-12 md:py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 md:mb-16">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 md:mb-6 leading-tight">
              Find Buddies on the Same Route
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-3 md:mb-4 px-2">
              AIUB → Kuril, Jamuna Future Park & More!
            </p>
            <div className="flex items-center justify-center gap-2 text-gray-500 text-sm md:text-base">
              <Mail className="h-4 md:h-5 w-4 md:w-5" />
              <span>Exclusively for AIUB Students</span>
            </div>
          </div>

          {/* Problem & Solution Cards */}
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-12 md:mb-16">
            {/* Daily Problems */}
            <Card className="bg-red-50 border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-10 md:w-12 h-10 md:h-12 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-xl md:text-2xl">😰</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-red-800">Daily Problems</h2>
                  <span className="text-xs md:text-sm bg-red-100 text-red-700 px-2 py-1 rounded-full">
                    For AIUB Students
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-red-700">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Going alone costs a lot</span>
                  </div>
                  <div className="bg-red-100 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-red-800">20-30</div>
                        <div className="text-sm text-red-600">BDT (Short)</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-red-800">40-50</div>
                        <div className="text-sm text-red-600">BDT (Long)</div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-red-700">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">Traveling alone feels unsafe</span>
                  </div>
                  <div className="flex items-center gap-3 text-red-700">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <span className="font-medium">No one to share costs with</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Solution */}
            <Card className="bg-green-50 border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-10 md:w-12 h-10 md:h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <Sparkles className="h-5 md:h-6 w-5 md:w-6 text-white" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold text-green-800">Solution = Buddy Ride</h2>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Sign up with your AIUB email</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Post your route & time</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Get matched with buddies</span>
                  </div>
                  <div className="flex items-center gap-3 text-green-700">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Chat with your travel buddies</span>
                  </div>
                  <div className="bg-green-100 rounded-xl p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-800">40 BDT</div>
                        <div className="text-sm text-green-600">Alone</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-800">20 BDT</div>
                        <div className="text-sm text-green-600">With Buddy</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white/50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Buddy Ride?
            </h2>
            <p className="text-xl text-gray-600">
              Safe, affordable, and convenient travel for AIUB students
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Safety First */}
            <Card className="bg-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Safety First</h3>
                <p className="text-gray-600 mb-4">
                  Match only male-to-male or female-to-female for maximum safety and comfort
                </p>
                <div className="bg-blue-50 rounded-lg p-3">
                  <span className="text-blue-800 font-medium">🔒 Gender-based matching</span>
                </div>
              </CardContent>
            </Card>

            {/* Cost Sharing */}
            <Card className="bg-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Save Money</h3>
                <p className="text-gray-600 mb-4">
                  Split transportation costs and save up to 50% on your daily commute
                </p>
                <div className="bg-green-50 rounded-lg p-3">
                  <span className="text-green-800 font-medium">💰 50% cost reduction</span>
                </div>
              </CardContent>
            </Card>

            {/* Easy Matching */}
            <Card className="bg-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Easy Matching</h3>
                <p className="text-gray-600 mb-4">
                  Find buddies going the same route at the same time automatically
                </p>
                <div className="bg-purple-50 rounded-lg p-3">
                  <span className="text-purple-800 font-medium">🤝 Smart algorithm</span>
                </div>
              </CardContent>
            </Card>

            {/* Real-time Chat */}
            <Card className="bg-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Real-time Chat</h3>
                <p className="text-gray-600 mb-4">
                  Coordinate with your travel buddies through built-in messaging
                </p>
                <div className="bg-orange-50 rounded-lg p-3">
                  <span className="text-orange-800 font-medium">💬 Instant messaging</span>
                </div>
              </CardContent>
            </Card>

            {/* Route Tracking */}
            <Card className="bg-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Navigation className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Popular Routes</h3>
                <p className="text-gray-600 mb-4">
                  AIUB to Kuril, Jamuna Future Park, and other popular destinations
                </p>
                <div className="bg-teal-50 rounded-lg p-3">
                  <span className="text-teal-800 font-medium">🗺️ Optimized routes</span>
                </div>
              </CardContent>
            </Card>

            {/* AIUB Verified */}
            <Card className="bg-white border-0 rounded-lg shadow-md hover:shadow-lg transition-all duration-200">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <UserCheck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">AIUB Verified</h3>
                <p className="text-gray-600 mb-4">
                  Only verified AIUB students can join - secure and trusted community
                </p>
                <div className="bg-indigo-50 rounded-lg p-3">
                  <span className="text-indigo-800 font-medium">✅ Student verified</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg md:text-xl text-gray-600">
              Get started in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl">
                <span className="text-xl md:text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Sign Up</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Create your account using your AIUB email address for verification
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl">
                <span className="text-xl md:text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Post Route</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Share your travel route, time, and find others going the same way
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 md:w-20 h-16 md:h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 md:mb-6 shadow-xl">
                <span className="text-xl md:text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-3 md:mb-4">Connect</h3>
              <p className="text-gray-600 text-sm md:text-base">
                Get matched with travel buddies and coordinate through chat
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 md:py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 md:mb-6">
            Ready to Start Saving Money?
          </h2>
          <p className="text-lg md:text-xl text-blue-100 mb-6 md:mb-8 px-2">
            Join hundreds of AIUB students who are already sharing rides and saving money!
          </p>
          <Button
            onClick={handleGetStarted}
            className="bg-white text-blue-600 hover:bg-gray-100 rounded-xl px-6 md:px-8 py-3 md:py-4 text-base md:text-lg font-bold shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            Get Started Now
            <ArrowRight className="h-4 md:h-5 w-4 md:w-5 ml-2" />
          </Button>
          <p className="text-blue-200 text-xs md:text-sm mt-4">
            Free to join • AIUB email required • Safe & secure
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Car className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Buddy Ride</h3>
              </div>
              <p className="text-gray-400">
                Safe, affordable transportation sharing for AIUB students
              </p>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Popular Routes</h4>
              <ul className="space-y-2 text-gray-400">
                <li>AIUB → Kuril</li>
                <li>AIUB → Jamuna Future Park</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-bold mb-4">Features</h4>
              <ul className="space-y-2 text-gray-400">
                <li>Gender-based matching</li>
                <li>Real-time chat</li>
                <li>Cost sharing</li>
                <li>AIUB verified</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Buddy Ride. Made for AIUB students with ❤️</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
