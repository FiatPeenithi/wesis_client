import { motion, type Variants } from "framer-motion";
import {
    Phone,
    Mail,
    ChevronLeft
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAuthStore } from "../store/useAuthStore";
import { cn } from "../lib/utils";

export default function ContactPage() {
    const { user } = useAuthStore();
    const isLightMode = (user as any)?.currentStage >= 5;

    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 px-4">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
            >
                {/* Header Section */}
                <motion.div variants={itemVariants} className="space-y-4">
                    <div className="flex items-center gap-4 mb-8">
                        <Link to="/profile" className={cn("transition-colors", isLightMode ? "text-slate-800 hover:text-slate-600" : "text-white hover:text-white/80")}>
                            <ChevronLeft className="w-6 h-6" />
                        </Link>
                        <h1 className={cn("text-xl md:text-xl text-start font-bold", isLightMode ? "text-slate-900" : "text-white")}>Contact Us</h1>
                    </div>
                    <p className={cn("text-center font-medium leading-relaxed max-w-md mx-auto", isLightMode ? "text-slate-500" : "text-white/50")}>
                        กรณีที่มีเหตุจำเป็น หรือฉุกเฉิน ที่เกี่ยวข้องกับโครงการวิจัยสามารถติดต่อผู้รับผิดชอบโครงการได้โดยสะดวกที่
                    </p>
                </motion.div>

                {/* Contact Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <motion.a
                        href="tel:0871226269"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "group relative border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-all overflow-hidden shadow-xl",
                            isLightMode
                                ? "bg-white border-slate-200 hover:border-yellow-500/50 hover:shadow-2xl"
                                : "bg-zinc-900/50 border-white/10 hover:bg-zinc-900/80 hover:border-yellow-400/30"
                        )}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-yellow-400/10 transition-transform group-hover:scale-110">
                            <Phone className="w-7 h-7 text-black" />
                        </div>
                        <span className={cn("text-sm font-medium uppercase mb-1 tracking-widest", isLightMode ? "text-yellow-600/70" : "text-yellow-400/50")}>เบอร์โทรศัพท์</span>
                        <div className={cn("text-xl font-medium transition-colors", isLightMode ? "text-slate-800 group-hover:text-yellow-600" : "text-white group-hover:text-yellow-400")}>087-1226269</div>
                    </motion.a>

                    <motion.a
                        href="mailto:wesis2026@gmail.com"
                        variants={itemVariants}
                        whileHover={{ scale: 1.02, translateY: -4 }}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "group relative border rounded-[2rem] p-8 flex flex-col items-center justify-center text-center transition-all overflow-hidden shadow-xl",
                            isLightMode
                                ? "bg-white border-slate-200 hover:border-yellow-500/50 hover:shadow-2xl"
                                : "bg-zinc-900/50 border-white/10 hover:bg-zinc-900/80 hover:border-yellow-400/30"
                        )}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 border",
                            isLightMode ? "bg-slate-100 border-slate-200 group-hover:border-yellow-500/50" : "bg-white/5 border-white/10 group-hover:border-yellow-400/30"
                        )}>
                            <Mail className={cn("w-7 h-7 transition-colors", isLightMode ? "text-slate-600 group-hover:text-yellow-600" : "text-white group-hover:text-yellow-400")} />
                        </div>
                        <span className={cn("text-sm font-medium uppercase mb-1 tracking-widest", isLightMode ? "text-slate-400" : "text-white/30")}>อีเมลแอดเดรส</span>
                        <div className={cn("text-xl font-medium transition-colors break-all", isLightMode ? "text-slate-800 group-hover:text-yellow-600" : "text-white group-hover:text-yellow-400")}>wesis2026@gmail.com</div>
                    </motion.a>
                </div>

                <div className="pt-4">
                    <img
                        src="/model/model4.png"
                        alt="Model4"
                        className="w-[200px] h-[300px] object-cover mx-auto"
                    />
                </div>
            </motion.div>
        </div>
    );
}
