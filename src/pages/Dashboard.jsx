import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { GameCardSkeleton } from "../components/Skeleton";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaSearch,
  FaLockOpen,
  FaBook,
  FaBoxOpen,
  FaDownload,
  FaRocket,
  FaCheckCircle,
  FaTimes,
  FaCog,
} from "react-icons/fa";

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [library, setLibrary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [hoveredGame, setHoveredGame] = useState(null);

  const [vaultOpen, setVaultOpen] = useState(false);
  const [vaultGame, setVaultGame] = useState(null);
  const [vaultLinks, setVaultLinks] = useState([]);
  const [vaultGuide, setVaultGuide] = useState("");
  const [voraLink, setVoraLink] = useState("");
  const [voraAppId, setVoraAppId] = useState("");
  const [isInstalling, setIsInstalling] = useState(false);
  const [installStep, setInstallStep] = useState(0);
  const [showEngineWarning, setShowEngineWarning] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    document.body.style.opacity = "1";

    let cancelled = false;
    const safetyTimeout = setTimeout(() => {
      if (!cancelled) setLoading(false);
    }, 8000);

    (async () => {
      try {
        const { data, error } = await supabase
          .from("library")
          .select("*, games(*)")
          .eq("user_id", user.id)
          .in("status", ["approved", "completed"]);
        if (error) {
          console.error("Library query error:", error);
          if (!cancelled) setLibrary([]);
        } else {
          if (!cancelled) {
            setLibrary(data || []);
            if (data && data.length > 0) setHoveredGame(data[0].games);
          }
        }
      } catch (err) {
        if (!cancelled) console.error("loadLibrary error:", err);
      } finally {
        if (!cancelled) setLoading(false);
        clearTimeout(safetyTimeout);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(safetyTimeout);
    };
  }, [user]);

  const openVault = async (gameId, showTutorial = false) => {
    const { data: game } = await supabase
      .from("games")
      .select("*")
      .eq("id", gameId)
      .single();
    if (!game) return;
    setVaultGame(game.title);
    setVaultLinks(game.download_links || []);
    setVaultGuide(game.manual_guide || "Panduan belum tersedia.");
    setVoraLink(game.voratools_link || "");
    setVoraAppId(game.steam_appid || "");
    setVaultOpen(true);
    if (showTutorial) {
      setTimeout(() => {
        document
          .getElementById("guide-section")
          ?.scrollIntoView({ behavior: "smooth" });
      }, 300);
    }
  };

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
    const lB64 = encodeURIComponent(btoa(voraLink));
    const nB64 = encodeURIComponent(
      btoa(encodeURIComponent(vaultGame || "Game")),
    );
    const a = voraAppId || "0";

    const gvrUrl = `gvr://install/?s=${sB64}&l=${lB64}&a=${a}&n=${nB64}`;

    const failTimeout = setTimeout(() => {
      if (document.hasFocus()) {
        setIsInstalling(false);
        localStorage.removeItem("gvr_engine_installed");
        setShowEngineWarning(true);
      }
    }, 2500);

    window.addEventListener(
      "blur",
      () => {
        clearTimeout(failTimeout);
      },
      { once: true },
    );

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

  const filteredLibrary = library.filter((item) => {
    const title = item.games?.title?.toLowerCase() || "";
    const genre = item.games?.genre?.toLowerCase() || "";
    const ctype = item.games?.connectivity_type || "";
    const q = search.toLowerCase();
    
    let matchFilter = true;
    if (filter === 'Online') matchFilter = ctype === 'Online';
    if (filter === 'Offline') matchFilter = ctype === 'Offline';
    
    return matchFilter && (title.includes(q) || genre.includes(q));
  });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 300, damping: 24 },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0A0C] text-white">
        <Navbar />
        <main className="pt-32 px-6 max-w-7xl mx-auto pb-8">
          <div className="mb-10">
            <div className="w-32 h-3 bg-white/5 rounded-full skeleton mb-4" />
            <div className="w-64 h-8 bg-white/5 rounded-xl skeleton mb-2" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <GameCardSkeleton key={i} />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0C] text-white relative font-sans overflow-x-hidden">
      <Helmet>
        <title>My Vault | GAMEVORA</title>
        <meta name="description" content="Akses game milikmu di Vault." />
      </Helmet>

      <Navbar />

      {/* Cinematic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none transition-opacity duration-300 transform-gpu ease-in-out">
        <AnimatePresence mode="wait">
          {hoveredGame && (
            <motion.div
              key={hoveredGame.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0 w-full h-full"
            >
              <img
                src={
                  hoveredGame.banner_url ||
                  hoveredGame.image_url ||
                  hoveredGame.thumbnail
                }
                className="w-full h-full object-cover blur-sm scale-105"
                alt="Background"
              />
            </motion.div>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0C] via-[#0A0A0C]/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/60 to-transparent" />
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] " />
      </div>

      <main className="pt-20 min-h-screen relative z-10 w-full flex flex-col lg:flex-row">
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Dynamic Hero Section */}
          <div className="p-8 lg:p-16 xl:p-24 flex-shrink-0 flex flex-col justify-end min-h-[55vh]">
            <AnimatePresence mode="wait">
              {hoveredGame ? (
                <motion.div
                  key={hoveredGame.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.5, type: "spring", damping: 20 }}
                  className="max-w-4xl"
                >
                  <div className="flex items-center gap-3 mb-6">
                    <span className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400 backdrop-blur-md shadow-lg">
                      {hoveredGame.genre}
                    </span>
                    <span className="px-3 py-1.5 bg-black/40 border border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-gray-300 backdrop-blur-md">
                      {hoveredGame.connectivity_type || "Offline"}
                    </span>
                  </div>

                  <h1 className="text-6xl md:text-7xl lg:text-[90px] font-black uppercase tracking-tighter text-white mb-8  leading-[0.9]">
                    {hoveredGame.title}
                  </h1>

                  <div className="flex flex-wrap gap-4">
                    <button
                      onClick={() => openVault(hoveredGame.id)}
                      className="px-10 py-5 bg-white text-black rounded-xl font-black uppercase tracking-[0.2em] text-sm hover:scale-105 active:scale-95 transition-colors  flex items-center justify-center gap-3"
                    >
                      <FaLockOpen size={18} /> Launch Game
                    </button>
                    <button
                      onClick={() => openVault(hoveredGame.id, true)}
                      className="px-8 py-5 bg-[#0A0A0C]/60 text-white border border-white/20 rounded-xl font-bold uppercase tracking-[0.2em] text-sm hover:bg-white/10 backdrop-blur-md transition-colors flex items-center justify-center gap-3"
                    >
                      <FaBook size={18} /> View Intel
                    </button>
                  </div>
                </motion.div>
              ) : (
                <div className="h-48 flex items-end">
                  <h1 className="text-4xl text-gray-600 font-black uppercase">
                    Your Vault is Empty
                  </h1>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Glass Sidebar & Carousel Grid */}
          <div className="flex-1 bg-gradient-to-t from-[#0A0A0C] via-[#0A0A0C]/90 to-transparent p-8 lg:p-12 pb-32">
            <div className="flex flex-col lg:flex-row gap-12">
              {/* Filter Sidebar */}
              <div className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8">
                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-4">
                    Search Vault
                  </h3>
                  <div className="relative group">
                    <div className="absolute inset-0 bg-white/[0.05] rounded-xl transition-colors group-hover:bg-white/[0.08] border border-white/10" />
                    <div className="relative flex items-center px-4 py-3">
                      <FaSearch className="text-gray-400 text-sm mr-3" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Title / Genre..."
                        className="w-full bg-transparent outline-none text-xs font-bold text-white placeholder:text-gray-600 tracking-wider uppercase"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-500 mb-4">
                    Library Filter
                  </h3>
                  <div className="flex flex-col gap-2">
                    {["all", "Online", "Offline"].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setFilter(cat)}
                        className={`relative px-4 py-3 text-left rounded-xl transition-colors font-bold text-xs uppercase tracking-widest ${filter === cat ? "bg-white/10 text-white border border-white/20 shadow-lg" : "text-gray-500 hover:text-gray-300 hover:bg-white/5 border border-transparent"}`}
                      >
                        {cat === "all" ? "All Collection" : `${cat} Games`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Game Carousel / Grid */}
              <div className="flex-1 overflow-hidden">
                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-gray-500 mb-6">
                  Your Collection
                </h3>

                {filteredLibrary.length === 0 ? (
                  <div className="text-center py-20 bg-white/[0.02] border border-white/5 rounded-3xl">
                    <FaBoxOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">
                      No games found.
                    </p>
                  </div>
                ) : (
                  <div className="flex overflow-x-auto gap-6 pb-12 pt-4 px-4 -mx-4 snap-x snap-mandatory [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-thumb]:bg-white/20 [&::-webkit-scrollbar-track]:bg-white/5">
                    {filteredLibrary.map((item) => {
                      const g = item.games;
                      if (!g) return null;
                      const isHovered = hoveredGame?.id === g.id;
                      return (
                        <div
                          key={item.id}
                          onMouseEnter={() => setHoveredGame(g)}
                          onClick={() => setHoveredGame(g)}
                          className={`relative shrink-0 w-[240px] aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer snap-start transition-colors duration-500 ${isHovered ? "scale-105  border-cyan-400/50" : "border-white/10 hover:border-white/30"} border bg-[#0A0A0C]`}
                        >
                          <img
                            src={g.thumbnail}
                            className="w-full h-full object-cover"
                            alt={g.title}
                          />

                          {/* Inner Overlay */}
                          <div
                            className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? "bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-100" : "bg-black/40 opacity-0 group-hover:opacity-100"}`}
                          >
                            <div className="absolute bottom-6 left-6 right-6">
                              <h3 className="text-lg font-black uppercase tracking-tight text-white line-clamp-2 leading-tight drop-shadow-md">
                                {g.title}
                              </h3>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Vault Modal */}
      <AnimatePresence>
        {vaultOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] flex items-center justify-center p-4 sm:p-6"
          >
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setVaultOpen(false)}
            />
            <motion.div
              initial={{ scale: 0.95, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 20, opacity: 0 }}
              className="relative w-full max-w-2xl bg-[#0A0A0C]/95 border border-white/[0.08] rounded-[3rem] p-8 md:p-12  backdrop-blur-3xl max-h-[90vh] overflow-y-auto overflow-x-hidden flex flex-col"
            >
              {/* Modal Glow */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 blur-sm" />
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80" />

              <button
                onClick={() => setVaultOpen(false)}
                className="absolute top-8 right-8 p-3 bg-white/[0.03] border border-white/10 hover:bg-white/[0.1] hover:border-white/20 rounded-full transition-colors text-gray-400 hover:text-white hover:scale-110 active:scale-95 shadow-lg"
              >
                <FaTimes />
              </button>

              <div className="text-center mb-12 mt-6 relative">
                
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mb-6 ">
                  <FaLockOpen size={32} />
                </div>
                <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-3 drop-shadow-xl">
                  {vaultGame}
                </h2>
                <div className="inline-flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-[0.3em]">
                    Vault Unsealed & Secure
                  </p>
                </div>
              </div>

              <div className="space-y-10 flex-grow relative z-10">
                {/* Cloud Access */}
                <section>
                  <h4 className="text-[11px] font-black text-white uppercase tracking-[0.3em] mb-5 flex items-center gap-3 bg-white/[0.02] w-max px-4 py-2 rounded-xl border border-white/[0.05]">
                    <FaDownload className="text-cyan-400" /> Secure Cloud
                    Connect
                  </h4>
                  <div className="space-y-4">
                    {vaultLinks.length > 0 ? (
                      vaultLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-5 bg-[#0A0A0C]/50 border border-white/[0.08] rounded-[1.5rem] hover:border-cyan-500/50 hover:bg-cyan-500/5 hover: transition-colors group"
                        >
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-colors">
                              {link.icon === "tool" ? (
                                <FaCog size={18} />
                              ) : link.icon === "guide" ? (
                                <FaBook size={18} />
                              ) : (
                                <FaBoxOpen size={18} />
                              )}
                            </div>
                            <span className="text-sm font-black uppercase tracking-widest text-gray-200 group-hover:text-white transition-colors">
                              {link.label}
                            </span>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-500 group-hover:text-cyan-300 transition-colors bg-cyan-500/10 px-4 py-2 rounded-xl">
                            Extract
                          </span>
                        </a>
                      ))
                    ) : (
                      <div className="p-6 bg-white/[0.02] border border-dashed border-white/10 rounded-[1.5rem] text-center text-gray-500 text-xs font-bold tracking-widest uppercase">
                        No files allocated.
                      </div>
                    )}

                    {voraLink && (
                      <div className="pt-6 border-t border-white/[0.05] mt-6 space-y-4">
                        <button
                          onClick={handleAutoInstall}
                          className="w-full flex items-center justify-between p-5 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border border-cyan-500/40 rounded-[1.5rem] hover:from-cyan-600/30 hover:to-blue-600/30 transition-colors group overflow-hidden relative  hover:"
                        >
                          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-10 " />
                          
                          <div className="relative z-10 flex items-center gap-5">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white shadow-xl group-hover:scale-110 transition-transform">
                              <FaRocket size={24} />
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-black uppercase tracking-widest text-white drop-shadow-md">
                                VoraTools Auto Install
                              </span>
                              <span className="text-[10px] text-cyan-200 font-bold uppercase tracking-[0.2em] mt-1.5 opacity-80">
                                1-Click Steam Integration
                              </span>
                            </div>
                          </div>
                          <span className="relative z-10 text-[10px] font-black uppercase tracking-[0.2em] text-white transition-colors bg-white/20 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 group-hover:bg-white/30 group-hover:border-white/30 shadow-lg">
                            Execute
                          </span>
                        </button>
                        <p className="text-center mt-4">
                          <a
                            href="/GVREngine_Setup.bat"
                            download
                            className="text-[10px] font-black uppercase tracking-[0.1em] text-gray-500 hover:text-cyan-400 transition-colors border-b border-gray-600 hover:border-cyan-400 pb-1"
                          >
                            Engine Not Detected? Download Setup.
                          </a>
                        </p>
                      </div>
                    )}
                  </div>
                </section>

                {/* Guide Section */}
                <section id="guide-section">
                  <h4 className="text-[10px] font-black text-fuchsia-400 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <FaBook /> Petunjuk Instalasi
                  </h4>
                  <div className="p-5 md:p-6 bg-white/[0.02] rounded-2xl border border-white/[0.05] text-[13px] text-gray-300 leading-relaxed font-medium whitespace-pre-wrap shadow-inner">
                    {vaultGuide}
                  </div>
                </section>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Installer Overlay */}
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
                  <div className="relative w-24 h-24 mb-8">
                    <div className="absolute inset-0 border-[3px] border-purple-500/20 rounded-full animate-ping" />
                    <div className="absolute inset-0 border-[4px] border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center text-3xl text-purple-400">
                      <FaRocket />
                    </div>
                  </div>

                  <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-white">
                    System Integration
                  </h2>
                  <p className="text-xs text-purple-400 font-black uppercase tracking-widest mb-8 animate-pulse">
                    {installStep === 0
                      ? "Menginisialisasi VoraTools..."
                      : installStep === 1
                        ? "Membangun koneksi lokal..."
                        : "Sinkronisasi Library Steam..."}
                  </p>

                  <div className="w-full space-y-3 text-left">
                    <div className="bg-white/5 px-5 py-4 rounded-xl text-[10px] font-bold text-gray-300 border border-white/10 flex gap-3">
                      <span className="text-purple-400">01</span> Izinkan
                      browser membuka protokol.
                    </div>
                    <div className="bg-white/5 px-5 py-4 rounded-xl text-[10px] font-bold text-gray-300 border border-white/10 flex gap-3">
                      <span className="text-indigo-400">02</span> Proses
                      berjalan gaib di latar belakang.
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex flex-col items-center"
                >
                  <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center border-4 border-green-500/30 mb-6  text-green-400 text-4xl">
                    <FaCheckCircle />
                  </div>
                  <h2 className="text-2xl font-black uppercase tracking-tight mb-3 text-white">
                    Instalasi Selesai
                  </h2>
                  <p className="text-xs text-gray-400 leading-relaxed mb-8">
                    Game berhasil di-inject ke dalam Steam Library kamu. Buka
                    aplikasi Steam untuk memainkannya.
                  </p>
                </motion.div>
              )}

              <button
                onClick={() => setIsInstalling(false)}
                className="mt-8 px-10 py-4 bg-white/5 hover:bg-white/10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-colors text-white w-full border border-white/10"
              >
                Tutup Layar Ini
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Engine Warning */}
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
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-400 text-3xl mx-auto mb-6 border border-purple-500/20">
                <FaCog />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight mb-3 text-white">
                GVR Engine Dibutuhkan
              </h2>
              <p className="text-xs text-gray-400 leading-relaxed mb-8">
                Untuk menggunakan fitur 1-Click Install yang instan dan gaib,
                kamu harus menginstal GVR Engine terlebih dahulu di PC kamu
                (cukup 1x seumur hidup).
              </p>
              <div className="space-y-3">
                <a
                  href="/GVREngine_Setup.bat"
                  download
                  onClick={() =>
                    localStorage.setItem("gvr_engine_installed", "true")
                  }
                  className="block w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg hover:shadow-purple-500/30"
                >
                  Unduh & Pasang Engine
                </a>
                <button
                  onClick={proceedToInstall}
                  className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-colors"
                >
                  Saya Sudah Memasangnya
                </button>
              </div>
              <button
                onClick={() => setShowEngineWarning(false)}
                className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
              >
                <FaTimes />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
