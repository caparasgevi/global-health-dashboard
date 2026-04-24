import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import geviImg from "../assets/ourTeam/Gevi_image.png";
import kielImg from "../assets/ourTeam/Kiel_image.png";
import shaneImg from "../assets/ourTeam/Shane_image.png";
import elijahImg from "../assets/ourTeam/Elijah_image.png";
import leobertImg from "../assets/ourTeam/Leobert_image.png";
import teamImg from "../assets/ourTeam/ourTeam.png";

interface TeamMember {
  id: number;
  name: string;
  role: string;
  contribution: string;
  image: string;
  hoverImage: string;
}

const teamMembers: TeamMember[] = [
  {
    id: 1,
    name: "Mark Gevi S. Caparas",
    role: "Project Lead | Full-Stack Engineer",
    contribution:
      "Establishes foundational architecture for frontend and backend systems. Integrates API development and leads the implementation of the Home, About, and Trends pages.",
    image: geviImg,
    hoverImage: geviImg,
  },
  {
    id: 2,
    name: "Kiel Sebastian A. Dela Cruz",
    role: "Frontend & Geospatial Engineer",
    contribution:
      "Architects the high-performance geospatial engine and interactive Our Team platform. Specializes in seamless map synchronization and real-time spatial data visualization for precision disease tracking.",
    image: kielImg,
    hoverImage: kielImg,
  },
  {
    id: 3,
    name: "Ahlyssa Shane D. Dela Cruz",
    role: "Frontend Visualization Engineer",
    contribution:
      "Develops the Country Statistics page and analytical interfaces. Conducts data assessment of disease outbreaks to create high-precision, visually appealing visualizations.",
    image: shaneImg,
    hoverImage: shaneImg,
  },
  {
    id: 4,
    name: "Elijah M. Laquindanum",
    role: "Database Administrator & Backend Engineer",
    contribution:
      "Primary lead for database management and secure user authentication. Ensures scalable data architecture and seamless backend-to-frontend communication.",
    image: elijahImg,
    hoverImage: elijahImg,
  },
  {
    id: 5,
    name: "Leobert V. Jaspe",
    role: "Backend Data & Algorithms Engineer",
    contribution:
      "Engineers advanced risk scoring models and oversees backend systems. Collaborates on database refinement and high-efficiency API structures.",
    image: leobertImg,
    hoverImage: leobertImg,
  },
];

const OurTeam: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [selectedMember, setSelectedMember] = useState<number | null>(null);

  return (
    <div
      id="our-team"
      className={`py-12 md:py-20 px-4 flex flex-col items-center bg-gray-50 dark:bg-[#0a0a0a] transition-all duration-500 ${
        isRevealed ? "pb-20" : "pb-10"
      }`}
      onClick={() => setSelectedMember(null)}
    >
      {/* Header Section */}
      <div className="text-center mb-10 md:mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl md:text-5xl font-extrabold font-montserrat text-gray-900 dark:text-white mb-4 tracking-tight"
        >
          Meet Our{" "}
          <span className="text-[var(--color-brand-red)]">Team</span>
        </motion.h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto font-medium px-4 text-sm md:text-base">
          The multidisciplinary team dedicated to advancing HealthRadar's predictive surveillance and public health technology.
        </p>
      </div>

      <div className="w-full max-w-7xl flex justify-center">
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05, filter: "blur(15px)" }}
              onClick={(e) => {
                e.stopPropagation();
                setIsRevealed(true);
              }}
              className="cursor-pointer group relative rounded-3xl overflow-hidden w-full max-w-4xl aspect-[16/9] md:aspect-video shadow-2xl border border-white/20 bg-slate-200 dark:bg-slate-800"
            >
              <img
                src={teamImg}
                alt="Group Preview"
                className="w-full h-full object-cover object-center transition-transform duration-1000 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col items-center justify-end pb-8 md:pb-16 opacity-100 transition-all duration-500 group-hover:bg-black/40">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                  }}
                  className="flex flex-col items-center gap-3"
                >
                  <span className="text-white/60 text-[10px] md:text-xs uppercase tracking-[0.3em] font-bold">
                    Click to reveal the team
                  </span>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 w-full"
            >
              {teamMembers.map((member) => {
                const isActive = selectedMember === member.id;
                return (
                  <motion.div
                    key={member.id}
                    whileHover={{ y: -10 }}
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: member.id * 0.1, duration: 0.5 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedMember(isActive ? null : member.id);
                    }}
                    className="group relative h-[420px] md:h-[480px] bg-white dark:bg-[#121212] rounded-2xl overflow-hidden flex flex-col shadow-xl border border-gray-100 dark:border-white/5 cursor-pointer"
                  >
                    <div className="relative w-full h-[300px] md:h-[340px] overflow-hidden bg-gray-200 dark:bg-gray-800">
                      <img
                        src={member.image}
                        alt={member.name}
                        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 group-hover:opacity-0 ${isActive ? "opacity-0" : "opacity-100"}`}
                      />
                      <img
                        src={member.hoverImage}
                        alt={`${member.name} focus`}
                        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-500 scale-105 group-hover:scale-100 group-hover:opacity-100 ${isActive ? "opacity-100 scale-100" : "opacity-0"}`}
                      />
                      <div
                        className={`absolute inset-0 bg-black/80 backdrop-blur-[3px] p-6 flex flex-col justify-center items-center text-center transition-all duration-500 ease-in-out ${isActive ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 md:group-hover:translate-y-0 md:group-hover:opacity-100"}`}
                      >
                        <h4 className="text-[var(--color-brand-red)] text-[10px] md:text-[11px] uppercase tracking-[0.2em] font-black mb-3">
                          Core Contributions
                        </h4>
                        <div className="w-10 h-[2px] bg-white/30 mb-4 rounded-full" />
                        <p className="text-white text-[11px] md:text-[12px] leading-relaxed font-medium px-2">
                          {member.contribution}
                        </p>
                      </div>
                    </div>
                    <div className="flex-grow flex flex-col justify-center p-4 md:p-5 text-center bg-white dark:bg-[#121212]">
                      <h3 className="font-montserrat font-bold text-[13px] md:text-[15px] leading-tight text-gray-900 dark:text-gray-100">
                        {member.name}
                      </h3>
                      <p className="font-inter text-[10px] md:text-[11px] font-semibold uppercase tracking-wider mt-2 text-[var(--color-brand-orange)]">
                        {member.role}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isRevealed && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsRevealed(false)}
          className="mt-12 md:mt-16 text-[10px] md:text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-brand-red)] transition-colors border-b border-transparent hover:border-[var(--color-brand-red)] pb-1"
        >
          ← Return to Overview
        </motion.button>
      )}
    </div>
  );
};

export default OurTeam;
