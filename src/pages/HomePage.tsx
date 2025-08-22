import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Car,
  Users,
  MessageSquare,
  Plus,
  Search,
  Shield,
  TrendingUp,
  Clock,
  MapPin,
  Bell,
  ArrowRight,
  BarChart2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import NotificationManager from "../components/NotificationManager";
import { useAuthStore } from "../stores/authStore";
import { useRideStore } from "../stores/rideStore";
import { isAdmin as checkIsAdmin } from "../utils/roles";
import { formatDistanceToNow, format } from "date-fns";

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}

const HomePage: React.FC = () => {
  const { user } = useAuthStore();
  const { myRides, messages, fetchMyRides } = useRideStore();
  const isAdmin = checkIsAdmin(user);

  useEffect(() => {
    if (user?.id) {
      fetchMyRides(user.id);
    }
  }, [user?.id, fetchMyRides]);

  const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => (
    <div
      className={`bg-gradient-to-br ${color} text-white p-3 sm:p-4 rounded-2xl shadow-lg flex items-center gap-3 sm:gap-4 min-h-[80px]`}
    >
      <div className="p-2 sm:p-3 bg-white/20 rounded-full flex-shrink-0">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="text-xl sm:text-2xl font-bold truncate">{value}</div>
        <div className="text-xs sm:text-sm opacity-80">{label}</div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-6 pb-20 lg:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 lg:mb-10">
          <div className="flex flex-col gap-4 mb-6">
            <div className="text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">
                Welcome, {user?.profile?.name?.split(" ")[0] || "Buddy"}!
              </h1>
              <p className="text-gray-600 mt-2 text-sm sm:text-base lg:text-lg">
                Here's your dashboard to manage your rides and connect.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
              <Link to="/post-ride" className="flex-1 sm:flex-none">
                <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-lg min-h-[44px]">
                  <Plus className="h-4 w-4 mr-2" />
                  Post a Ride
                </Button>
              </Link>
              <Link to="/find-buddy" className="flex-1 sm:flex-none">
                <Button variant="outline" className="w-full sm:w-auto shadow-lg min-h-[44px]">
                  <Search className="h-4 w-4 mr-2" />
                  Find a Ride
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatCard
            icon={<Car className="h-6 w-6 text-white" />}
            label="Upcoming Rides"
            value={myRides.length}
            color="from-blue-500 to-blue-700"
          />
          <StatCard
            icon={<Users className="h-6 w-6 text-white" />}
            label="Total Requests"
            value={myRides.reduce(
              (sum, ride) => sum + (ride.requests_count || 0),
              0
            )}
            color="from-green-500 to-green-700"
          />
          <StatCard
            icon={<MessageSquare className="h-6 w-6 text-white" />}
            label="Messages"
            value={messages.length}
            color="from-purple-500 to-purple-700"
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* Your Rides Section */}
            <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl lg:text-2xl flex items-center gap-3">
                    <div className="p-2 bg-gray-100 rounded-lg">
                      <Car className="h-5 w-5 text-gray-600" />
                    </div>
                    Your Upcoming Rides
                  </CardTitle>
                  {myRides.length > 3 && (
                    <Link to="/profile">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        View All
                      </Button>
                    </Link>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {myRides.length === 0 ? (
                  <div className="text-center py-12 lg:py-16">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                      <Car className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">
                      You have no upcoming rides
                    </h3>
                    <p className="text-gray-500 text-sm lg:text-base mb-6 max-w-md mx-auto">
                      Ready to hit the road? Post a ride to find a travel
                      buddy.
                    </p>
                    <Link to="/post-ride">
                      <Button
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Post Your First Ride
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {myRides.slice(0, 3).map((ride) => (
                      <div
                        key={ride.id}
                        className="group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 lg:p-5 bg-white rounded-xl border border-gray-200 hover:shadow-lg hover:border-blue-300 transition-all duration-300"
                      >
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <MapPin className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-gray-900 text-base lg:text-lg">
                              {ride.from_location}
                              <ArrowRight className="inline mx-2 h-4 w-4 text-gray-400" />
                              {ride.to_location}
                            </h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Clock className="h-4 w-4" />
                                {ride.ride_time
                                  ? format(
                                      new Date(ride.ride_time),
                                      "MMM dd, hh:mm a"
                                    )
                                  : "No date"}
                              </span>
                              <span className="hidden sm:inline-flex items-center gap-1.5">
                                <Users className="h-4 w-4" />
                                <span>{ride.requests_count || 0} Requests</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 sm:mt-0 flex items-center gap-2 self-end sm:self-center">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                          <Link to={`/ride/${ride.id}/manage`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-blue-600"
                            >
                              Manage
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6 lg:space-y-8">
            {/* Notifications */}
            <NotificationManager maxItems={5} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
