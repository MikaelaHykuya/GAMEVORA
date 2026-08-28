import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@lib/supabase";
import { formatRupiah } from "@lib/utils";
import { useAuth } from "../contexts/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useWishlist } from "../contexts/WishlistContext";
import { useToast } from "../contexts/ToastContext";
import TypingText from "../components/TypingText";
import Reviews from "../components/Reviews";
import Navbar from "../components/Navbar";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaShoppingCart,
  FaUnlock,
  FaHeart,
  FaRegHeart,
  FaStar,
  FaDesktop,
  FaMicrochip,
  FaMemory,
  FaGamepad,
  FaDownload,
  FaRocket,
  FaCheckCircle,
  FaTimes,
  FaCog,
  FaBook,
  FaBoxOpen,
} from "react-icons/fa";

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart, fetchCartCount, handleDirectBuy } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [avgRating, setAvgRating] = useState("0.0");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  const [showEngineWarning, setShowEngineWarning] = useState(false);

  useEffect(() => {
    if (!id) {
      navigate("/");
      return;
    }
    loadGame();
  }, [id]);

  async function loadGame() {
    try {
      const { data, error } = await supabase
        .from("games")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      setGame(data);

      if (user) {
        const { data: entry } = await supabase
          .from("library")
          .select("status")
          .eq("user_id", user.id)
          .eq("game_id", id)
          .maybeSingle();
        if (entry) setStatus(entry.status);
      }
      loadReviews();
      fetchCartCount();
    } catch {
      navigate("/");
    } finally {
      setLoading(false);
    }
  }

  async function loadReviews() {
    const { data } = await supabase
      .from("reviews")
      .select(
        "id, rating, comment, created_at, profiles:user_id(full_name, avatar_url)",
      )
      .eq("game_id", id)
      .order("created_at", { ascending: false });
    if (data && data.length > 0) {
      setAvgRating(
        (data.reduce((acc, r) => acc + r.rating, 0) / data.length).toFixed(1),
      );
    }
  }

  const handleBuy = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    handleDirectBuy(game);
  };

  // handleCheckout is handled globally

  const handleAutoInstall = () => {
    if (!localStorage.getItem("gvr_engine_installed")) {
      setShowEngineWarning(true);
      return;
    }

    setIsInstalling(true);
    setInstallStep(0);
    const scriptUrl = new URL(
      "voratools.ps1",
      `${window.location.origin}${import.meta.env.BASE_URL}`,
    ).href;

    const sB64 = encodeURIComponent(btoa(scriptUrl));
    const lB64 = encodeURIComponent(btoa(game.voratools_link));
    const nB64 = encodeURIComponent(
      btoa(encodeURIComponent(game.title || "Game")),
    );
    const a = game.steam_appid || "0";

    const gvrUrl = `gvr://install/?s=${sB64}&l=${lB64}&a=${a}&n=${nB64}`;

    const failTimeout = setTimeout(() => {
      if (document.hasFocus()) {
        setIsInstalling(false);
        localStorage.removeItem("gvr_engine_installed");
        setShowEngineWarning(true);
      }
    }, 2500);

    window.addEventListener("blur", () => clearTimeout(failTimeout), {
      once: true,
    });
    window.location.href = gvrUrl;

    const step1 = setTimeout(() => setInstallStep(1), 3000);
    const step2 = setTimeout(() => setInstallStep(2), 7000);
    const step3 = setTimeout(() => setInstallStep(3), 14000);

    window.addEventListener(
      "focus",
      () => {
        if (!localStorage.getItem("gvr_engine_installed")) {
          clearTimeout(step1);
          clearTimeout(step2);
          clearTimeout(step3);
        }
      },
      { once: true },
    );
  };

  const proceedToInstall = () => {
    localStorage.setItem("gvr_engine_installed", "true");
    setShowEngineWarning(false);
    handleAutoInstall();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } },
  };
  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };
  const slideInLeft = {
    hidden: { opacity: 0, x: -50 },
    show: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-t-2 border-r-2 border-indigo-500 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">
            Syncing Intel...
          </p>
        </div>
      </div>
    );
  }

  if (!game) return null;

  const basePrice = game.discount_price > 0 ? game.discount_price : game.price;
  const hasDiscount = game.discount_price > 0;
  const discountPercent = hasDiscount
    ? Math.round((1 - game.discount_price / game.price) * 100)
    : 0;
  const specIcons = {
    os: <FaDesktop />,
    cpu: <FaMicrochip />,
    ram: <FaMemory />,
    gpu: <FaGamepad />,
  };
  const linkIcons = { box: <FaBoxOpen />, tool: <FaCog />, guide: <FaBook /> };

  return (
    <div className="min-h-screen bg-[#030303] text-white font-sans overflow-x-hidden relative">
      <Helmet>
        <title>{game.title} | GAMEVORA</title>
        <meta
          name="description"
          content={`Detail and purchase options for ${game.title}`}
        />
      </Helmet>

      {/* Cinematic Hero Background */}
      <div className="absolute top-0 left-0 w-full h-[65vh] z-0 overflow-hidden pointer-events-none">
        <img
          src={game.thumbnail}
          alt="Background"
          className="w-full h-full object-cover opacity-20 blur-md scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/80 via-transparent to-transparent" />
      </div>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-1/4 left-0 w-[500px] h-[500px] bg-fuchsia-600/10 rounded-full blur-[120px] mix-blend-screen" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.04] mix-blend-overlay" />
      </div>

      <Navbar />

      <main className="max-w-7xl mx-auto pt-32 pb-20 px-4 md:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center gap-2 mb-8 text-[10px] font-black uppercase tracking-widest text-gray-400"
        >
          <Link to="/" className="hover:text-purple-400 transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link to="/store" className="hover:text-purple-400 transition-colors">
            Store
          </Link>
          <span>/</span>
          <span className="text-white">{game.title}</span>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* LEFT COLUMN: Main Content */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="lg:col-span-8 space-y-12"
          >
            {/* Title Section */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 backdrop-blur-md rounded-2xl border border-purple-500/30 text-purple-200 text-[10px] font-black uppercase tracking-widest shadow-lg">
                {game.genre || "Game"}
              </div>
              <h1 className="text-5xl sm:text-6xl md:text-7xl font-black uppercase tracking-tight leading-[0.9] text-white drop-shadow-2xl">
                {game.title}
              </h1>
            </motion.div>

            {/* Description */}
            <motion.div
              variants={itemVariants}
              className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-8 backdrop-blur-md shadow-2xl relative overflow-hidden"
            >
              <h3 className="text-xs font-black text-purple-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <FaBook /> Deskripsi Game
              </h3>
              <div className="text-sm md:text-base text-gray-300 leading-relaxed font-medium">
                <TypingText text={game.description} speed={25} delay={300} />
              </div>
            </motion.div>

            {/* System Requirements */}
            <motion.div
              variants={itemVariants}
              className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-8 backdrop-blur-md shadow-2xl"
            >
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-purple-400 mb-8 flex items-center gap-3">
                <FaDesktop className="text-lg" /> System Requirements
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  ["Minimal", "minimum", "gray"],
                  ["Recommended", "recommended", "fuchsia"],
                ].map(([label, key, color]) => (
                  <div
                    key={key}
                    className={`p-6 bg-white/[0.02] border ${color === "fuchsia" ? "border-fuchsia-500/30" : "border-white/5"} rounded-3xl`}
                  >
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${color === "fuchsia" ? "text-fuchsia-400" : "text-gray-500"} mb-5 block`}
                    >
                      {label}
                    </span>
                    <ul className="space-y-4">
                      {["os", "cpu", "ram", "gpu"].map((s) => (
                        <li key={s} className="flex items-center gap-4 text-xs">
                          <span className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-500">
                            {specIcons[s]}
                          </span>
                          <span className="text-gray-300 font-medium flex-1 leading-snug">
                            {game.specifications?.[key]?.[s] || "-"}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Reviews Section */}
            <motion.section variants={itemVariants} className="pt-4">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-3xl font-black uppercase text-white">
                  Ulasan
                </h3>
                <div className="bg-yellow-500/10 border border-yellow-500/20 px-4 py-2 rounded-xl flex items-center gap-2">
                  <FaStar className="text-yellow-400" />
                  <span className="text-lg font-black text-yellow-400">
                    {avgRating}
                  </span>
                </div>
              </div>
              <Reviews gameId={id} />
            </motion.section>
          </motion.div>

          {/* RIGHT COLUMN: Sticky Sidebar */}
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            animate="show"
            className="lg:col-span-4 relative"
          >
            <div className="sticky top-28 space-y-6">
              {/* Game Cover */}
              <div className="relative group rounded-[2rem] p-1 mb-6 hidden md:block">
                <div className="absolute inset-0 bg-gradient-to-b from-purple-500/30 to-blue-500/10 rounded-[2rem] blur-xl opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="relative bg-[#0a0a0a] rounded-[2rem] overflow-hidden shadow-2xl aspect-[3/4] border border-white/[0.05]">
                  <img
                    src={game.thumbnail}
                    alt={game.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-[1.5s] ease-out"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030303]/90 via-transparent to-transparent" />
                </div>
              </div>

              {/* Purchase Action Box */}
              <div className="bg-[#0A0A0C]/80 border border-white/[0.08] backdrop-blur-2xl rounded-[2rem] p-6 shadow-2xl">
                <div className="flex justify-between items-end mb-6">
                  <div>
                    {hasDiscount && (
                      <span className="inline-block px-3 py-1 mb-2 bg-fuchsia-600 rounded-lg text-white text-[10px] font-black tracking-widest shadow-[0_0_15px_rgba(192,38,211,0.5)]">
                        SAVE {discountPercent}%
                      </span>
                    )}
                    <p className="text-4xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                      {basePrice === 0 ? "FREE" : formatRupiah(basePrice)}
                    </p>
                  </div>
                  <button
                    onClick={() => toggleWishlist(game.id)}
                    className={`p-4 rounded-2xl border transition-all ${
                      isInWishlist(game.id)
                        ? "bg-fuchsia-600/20 border-fuchsia-500/30 text-fuchsia-400 shadow-[0_0_20px_rgba(192,38,211,0.2)]"
                        : "bg-white/[0.05] border-white/10 text-gray-400 hover:text-fuchsia-400 hover:border-fuchsia-500/30 hover:bg-white/[0.1]"
                    }`}
                  >
                    {isInWishlist(game.id) ? (
                      <FaHeart size={20} />
                    ) : (
                      <FaRegHeart size={20} />
                    )}
                  </button>
                </div>

                {/* Stock Warning */}
                {game.stock !== null && game.stock !== undefined && (
                  <div
                    className={`w-full text-center px-4 py-3 mb-6 rounded-xl border font-black uppercase text-[10px] tracking-widest ${game.stock > 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`}
                  >
                    {game.stock > 0
                      ? `In Stock: ${game.stock} units`
                      : "Out of Stock"}
                  </div>
                )}

                {/* Actions */}
                {status === "approved" ? (
                  <div className="space-y-4">
                    <div className="w-full bg-green-500/10 text-green-400 p-4 rounded-xl text-center border border-green-500/20 font-black uppercase text-[10px] flex items-center justify-center gap-2">
                      <FaCheckCircle size={16} /> Game Owned
                    </div>
                    {game.voratools_link && (
                      <button
                        onClick={handleAutoInstall}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl group hover:shadow-[0_0_30px_rgba(168,85,247,0.5)] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <FaRocket className="text-white text-xl" />
                          <div className="flex flex-col text-left">
                            <span className="text-sm font-black text-white">
                              1-Click Install
                            </span>
                            <span className="text-[9px] font-bold text-white/70 uppercase">
                              VoraTools
                            </span>
                          </div>
                        </div>
                      </button>
                    )}
                    {game.download_links?.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:border-purple-500/50 transition-all group"
                      >
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase text-gray-500">
                            {link.label}
                          </span>
                        </div>
                        <span className="text-[10px] font-black text-purple-400 bg-purple-500/20 px-3 py-1.5 rounded-lg">
                          DL
                        </span>
                      </a>
                    ))}
                  </div>
                ) : status === "pending" ? (
                  <div className="w-full bg-yellow-500/10 text-yellow-400 p-4 rounded-xl text-center border border-yellow-500/20 font-black uppercase text-[10px]">
                    Verifying Payment...
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        if (game.stock !== 0) handleBuy();
                      }}
                      disabled={game.stock === 0}
                      className={`w-full py-5 rounded-2xl font-black text-sm uppercase flex items-center justify-center gap-3 transition-all ${
                        game.stock === 0
                          ? "bg-zinc-900/50 border border-red-500/10 text-red-500/50 cursor-not-allowed"
                          : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] hover:scale-[1.02]"
                      }`}
                    >
                      <FaUnlock />{" "}
                      {game.stock === 0 ? "Habis" : "Beli Sekarang"}
                    </button>
                    <button
                      onClick={() => {
                        if (game.stock !== 0) addToCart(game.id);
                      }}
                      disabled={game.stock === 0}
                      className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${
                        game.stock === 0
                          ? "bg-zinc-900/50 border border-white/5 text-gray-500 cursor-not-allowed"
                          : "bg-white/5 border border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <FaShoppingCart /> Add to Cart
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Modals are handled globally */}

      <AnimatePresence>
        {isInstalling && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-lg text-center flex flex-col items-center bg-[#0a0a0a] p-10 rounded-[3rem] border border-white/5 shadow-2xl"
            >
              {installStep < 3 ? (
                <>
                  <div className="w-24 h-24 mb-8 border-[4px] border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                  <h2 className="text-2xl font-black uppercase text-white">
                    System Integration
                  </h2>
                  <p className="text-xs text-purple-400 mt-2 animate-pulse">
                    {installStep === 0
                      ? "Menginisialisasi..."
                      : "Sinkronisasi..."}
                  </p>
                </>
              ) : (
                <div className="text-green-400 text-4xl mb-6">
                  <FaCheckCircle />
                </div>
              )}
              <button
                onClick={() => setIsInstalling(false)}
                className="mt-8 px-10 py-4 bg-white/5 rounded-xl font-black text-[10px] uppercase text-white w-full"
              >
                Tutup
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showEngineWarning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" />
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="relative w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[2rem] p-8 text-center shadow-2xl"
            >
              <h2 className="text-xl font-black uppercase mb-3">
                GVR Engine Dibutuhkan
              </h2>
              <p className="text-xs text-gray-400 mb-8">
                Install GVR Engine untuk akses 1-Click Install.
              </p>
              <div className="space-y-3">
                <a
                  href="/GVREngine_Setup.bat"
                  download
                  onClick={() =>
                    localStorage.setItem("gvr_engine_installed", "true")
                  }
                  className="block w-full py-4 bg-purple-600 rounded-xl text-xs font-bold uppercase"
                >
                  Unduh Engine
                </a>
                <button
                  onClick={proceedToInstall}
                  className="w-full py-4 bg-white/5 rounded-xl text-xs font-bold uppercase"
                >
                  Saya Sudah Pasang
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
