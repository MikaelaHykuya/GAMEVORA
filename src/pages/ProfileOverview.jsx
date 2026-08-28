import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import { useFriends } from "../contexts/FriendsContext";
import { useToast } from "../contexts/ToastContext";
import { formatRupiah, getAvatarUrl } from "@lib/utils";
import AvatarView from "../components/AvatarView";
import Navbar from "../components/Navbar";
import { Helmet } from "react-helmet-async";
import {
  FaUserCircle,
  FaGamepad,
  FaHeart,
  FaCog,
  FaHistory,
  FaCheck,
  FaPlus,
  FaTimes,
} from "react-icons/fa";

export default function ProfileOverview() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [libraryCount, setLibraryCount] = useState(0);
  const [totalSpending, setTotalSpending] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);

  const [searchParams] = useSearchParams();
  const profileParam = searchParams.get("user");
  const [viewedProfile, setViewedProfile] = useState(null);
  const displayProfile = viewedProfile || profile;

  const isOtherProfile = profileParam && profileParam !== user?.id;

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    init();
  }, [user, profileParam]);

  async function init() {
    const targetId =
      profileParam && profileParam !== user.id ? profileParam : user.id;

    if (profileParam && profileParam !== user.id) {
      const { data: otherProfile } = await supabase
        .from("profiles_public")
        .select("*")
        .eq("id", profileParam)
        .single();
      setViewedProfile(otherProfile || null);
    } else {
      setViewedProfile(null);
    }

    const [approvedCountRes, approvedLib, activityRes] = await Promise.all([
      supabase
        .from("library")
        .select("id", { count: "exact", head: true })
        .eq("user_id", targetId)
        .eq("status", "approved"),
      supabase
        .from("library")
        .select("id, games(price, discount_price, title), created_at")
        .eq("user_id", targetId)
        .eq("status", "approved")
        .limit(100),
      supabase
        .from("library")
        .select("id, games(title), created_at, status")
        .eq("user_id", targetId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    setLibraryCount(approvedCountRes.count || 0);
    setTotalSpending(
      (approvedLib.data || []).reduce(
        (acc, curr) =>
          acc + (Number(curr.games?.discount_price || curr.games?.price) || 0),
        0,
      ),
    );

    if (activityRes.data) {
      setRecentActivity(
        activityRes.data.map((a) => ({
          text:
            a.status === "approved"
              ? `Purchased ${a.games?.title || "a game"}`
              : `Ordered ${a.games?.title || "a game"}`,
          time: a.created_at,
        })),
      );
    }
  }

  if (!displayProfile) return <div className="min-h-screen bg-[#121212]" />;

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-gray-200 font-sans relative overflow-hidden">
      {/* Subtle Ambient Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        
        
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] " />
      </div>
      <Helmet>
        <title>Account Settings | GAMEVORA</title>
      </Helmet>

      <Navbar />

      <main className="pt-24 px-4 sm:px-8 max-w-[1200px] mx-auto pb-16 flex flex-col md:flex-row gap-8">
        {/* Left Sidebar - Epic Games Account Style */}
        <aside className="w-full md:w-64 flex-shrink-0">
          <h1 className="text-2xl font-semibold text-white mb-6 tracking-tight">
            Account
          </h1>
          <nav className="flex flex-col space-y-1">
            <Link
              to="/profile"
              className="px-4 py-3 bg-[#202020] text-white border-l-4 border-blue-500 font-semibold text-sm transition-colors"
            >
              <FaUserCircle className="inline mr-3 text-lg" /> Account Settings
            </Link>
            {!isOtherProfile && (
              <>
                <Link
                  to="/profile/collection"
                  className="px-4 py-3 text-gray-400 hover:bg-[#202020] hover:text-white border-l-4 border-transparent font-medium text-sm transition-colors"
                >
                  <FaGamepad className="inline mr-3 text-lg" /> Collection
                </Link>
                <Link
                  to="/profile/wishlist"
                  className="px-4 py-3 text-gray-400 hover:bg-[#202020] hover:text-white border-l-4 border-transparent font-medium text-sm transition-colors"
                >
                  <FaHeart className="inline mr-3 text-lg" /> Wishlist
                </Link>
                <Link
                  to="/profile/orders"
                  className="px-4 py-3 text-gray-400 hover:bg-[#202020] hover:text-white border-l-4 border-transparent font-medium text-sm transition-colors"
                >
                  <FaHistory className="inline mr-3 text-lg" /> Transactions
                </Link>
                <Link
                  to="/profile/settings"
                  className="px-4 py-3 text-gray-400 hover:bg-[#202020] hover:text-white border-l-4 border-transparent font-medium text-sm transition-colors"
                >
                  <FaCog className="inline mr-3 text-lg" /> Preferences
                </Link>
              </>
            )}
          </nav>
        </aside>

        {/* Right Content */}
        <div className="flex-1 min-w-0 relative z-10">
          <div className="mb-8">
            <h2 className="text-[26px] font-semibold text-white tracking-tight mb-2">
              Account Settings
            </h2>
            <p className="text-sm text-gray-400">
              Manage your account details and preferences.
            </p>
          </div>

          <div className="space-y-6">
            {/* Profile Info Card */}
            <div className="bg-[#18181C] border border-white/[0.05]  rounded-3xl flex flex-col sm:flex-row items-center p-8 gap-8 shadow-2xl hover:border-white/10 transition-colors">
              <div className="w-28 h-28 rounded-2xl bg-black/40 flex-shrink-0 overflow-hidden border border-white/10 ">
                <AvatarView
                  url={getAvatarUrl(displayProfile.avatar_url)}
                  effect={displayProfile.avatar_effect}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1">
                <h3 className="text-3xl font-black tracking-tight text-white mb-1 drop-shadow-md">
                  {displayProfile.username || "Gamer"}
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  {displayProfile.bio || "No bio provided."}
                </p>

                {isOtherProfile && (
                  <div className="flex items-center gap-3">
                    <FriendButton profileId={displayProfile.id} />
                  </div>
                )}
              </div>
            </div>

            {/* Account Details Form Style */}
            <div className="bg-[#18181C] border border-white/[0.05]  rounded-3xl p-8 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-6">
                Personal Details
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Display Name
                  </label>
                  <div className="px-5 py-4 bg-black/20 border border-white/5 rounded-xl shadow-inner text-gray-300 text-sm">
                    {displayProfile.username || "-"}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Account ID
                  </label>
                  <div className="px-5 py-4 bg-black/20 border border-white/5 rounded-xl shadow-inner text-gray-500 text-sm truncate font-mono">
                    {displayProfile.id}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Join Date
                  </label>
                  <div className="px-5 py-4 bg-black/20 border border-white/5 rounded-xl shadow-inner text-gray-300 text-sm">
                    {new Date(displayProfile.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">
                    Status
                  </label>
                  <div className="px-5 py-4 bg-black/20 border border-white/5 rounded-xl shadow-inner text-green-400 text-sm font-semibold flex items-center gap-2">
                    <FaCheck /> Active
                  </div>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-[#18181C] border border-white/[0.05]  rounded-3xl p-8 shadow-xl relative overflow-hidden">
              <h3 className="text-lg font-semibold text-white mb-6">
                Account Statistics
              </h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 bg-black/20 rounded-2xl border border-white/5 shadow-inner relative z-10 group hover:bg-black/40 transition-colors">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Total Games Owned
                  </p>
                  <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mt-2 block">
                    {libraryCount}
                  </p>
                </div>
                <div className="p-6 bg-black/20 rounded-2xl border border-white/5 shadow-inner relative z-10 group hover:bg-black/40 transition-colors">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Total Spent
                  </p>
                  <p className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mt-2 block">
                    {formatRupiah(totalSpending)}
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#18181C] border border-white/[0.05]  rounded-3xl p-8 shadow-xl">
              <h3 className="text-lg font-semibold text-white mb-6">
                Recent Transactions
              </h3>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No recent transactions found.
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivity.map((act, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-center py-3 border-b border-white/5 last:border-0"
                    >
                      <span className="text-sm text-gray-300">{act.text}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(act.time).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {!isOtherProfile && (
              <div className="pt-6 border-t border-white/5">
                <button
                  onClick={signOut}
                  className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 hover:text-red-300 rounded-xl font-bold text-xs transition-colors uppercase tracking-widest shadow-sm"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function FriendButton({ profileId }) {
  const {
    friends,
    sentRequests,
    receivedRequests,
    sendRequest,
    respondToRequest,
  } = useFriends();
  const { showToast } = useToast();

  let status = "none";
  if (friends.some((f) => f.friend_id === profileId)) status = "friends";
  else if (sentRequests.some((r) => r.receiver_id === profileId))
    status = "sent";
  else if (receivedRequests.some((r) => r.sender_id === profileId))
    status = "pending";

  if (status === "friends") {
    return (
      <span className="px-4 py-2 bg-[#202020] border border-gray-700 rounded text-xs font-bold uppercase tracking-wider text-green-400 flex items-center gap-2">
        <FaCheck /> Friends
      </span>
    );
  }

  if (status === "pending") {
    return (
      <div className="flex gap-2">
        <button
          onClick={async () => {
            await respondToRequest(profileId, true);
            showToast("Accepted!", "success");
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Accept
        </button>
        <button
          onClick={async () => {
            await respondToRequest(profileId, false);
          }}
          className="px-4 py-2 bg-[#202020] hover:bg-gray-700 text-gray-300 border border-gray-700 rounded text-xs font-bold uppercase tracking-wider transition-colors"
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === "sent") {
    return (
      <span className="px-4 py-2 bg-[#202020] border border-gray-700 rounded text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
        <FaCheck /> Request Sent
      </span>
    );
  }

  return (
    <button
      onClick={async () => {
        const { error } = await sendRequest(profileId);
        if (!error) showToast("Friend request sent!", "success");
      }}
      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
    >
      <FaPlus /> Add Friend
    </button>
  );
}
