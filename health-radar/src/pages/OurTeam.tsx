import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import geviImg from "../assets/ourTeam/Gevi_image.png";
import kielImg from "../assets/ourTeam/Kiel_image.png";
import shaneImg from "../assets/ourTeam/Shane_image.png";
import elijahImg from "../assets/ourTeam/Elijah_image.png";
import leobertImg from "../assets/ourTeam/Leobert_image.png";


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
      "Establishes foundational architecture for frontend and backend systems. Orchestrates API development and leads the implementation of the Home, About, and Trends modules.",
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
      "Develops the Country Statistics module and analytical interfaces. Conducts data assessment of disease outbreaks to create high-fidelity, visually appealing visualizations.",
    image: shaneImg,
    hoverImage: shaneImg,
  },
  {
    id: 4,
    name: "Elijah M. Laquindanum",
    role: "Database Administrator & Backend Engineer",
    contribution:
      "Primary lead for database management and secure user authentication. Ensures robust data architecture and seamless backend-to-frontend communication.",
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

  return (
    <div
      id="our-team"
      className="min-h-screen py-20 px-4 flex flex-col items-center bg-gray-50 dark:bg-[#0a0a0a] transition-colors duration-500"
    >
      <div className="text-center mb-16">
        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-5xl font-extrabold font-montserrat text-gray-900 dark:text-white mb-4 tracking-tight"
        >
          Meet Our{" "}
          <span className="text-[var(--color-brand-red)]">Expert Team</span>
        </motion.h1>
        <p className="text-gray-500 dark:text-gray-400 max-w-lg mx-auto font-medium">
          The multidisciplinary innovators behind HealthRadar's predictive
          surveillance technology.
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
              onClick={() => setIsRevealed(true)}
              className="cursor-pointer group relative rounded-3xl overflow-hidden w-full max-w-3xl h-[450px] shadow-2xl border border-white/20"
            >
              <img
                src="src/assets/ourTeam/ourTeam.png"
                alt="Group Preview"
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end pb-12 opacity-90 group-hover:opacity-100 transition-opacity">
                <motion.span
                  animate={{ y: [0, -5, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white px-8 py-3 rounded-full font-bold shadow-xl border border-white/10 hover:bg-[var(--color-brand-red)] hover:text-white transition-colors"
                >
                  Discover the Team
                </motion.span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-8 w-full"
            >
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  whileHover={{ y: -10 }}
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: member.id * 0.1, duration: 0.5 }}
                  className="group relative h-[480px] bg-white dark:bg-[#121212] rounded-2xl overflow-hidden flex flex-col shadow-xl border border-gray-100 dark:border-white/5"
                >
                  {/* Image Container */}
                  <div className="relative w-full h-[340px] overflow-hidden bg-gray-200 dark:bg-gray-800">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                    />
                    <img
                      src={member.hoverImage}
                      alt={`${member.name} focus`}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100 scale-105 group-hover:scale-100"
                    />

                    {/* Transparent Contribution Overlay */}
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-[1px] p-6 flex flex-col justify-center items-center text-center opacity-0 group-hover:opacity-100 transition-all duration-500 ease-in-out translate-y-4 group-hover:translate-y-0">
                      <h4 className="text-[var(--color-brand-red)] text-[11px] uppercase tracking-[0.2em] font-black mb-3 drop-shadow-md">
                        Core Contributions
                      </h4>
                      <div className="w-10 h-[2px] bg-white/30 mb-4 rounded-full" />
                      <p className="text-white text-[12px] leading-relaxed font-bold drop-shadow-lg px-2">
                        {member.contribution}
                      </p>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-grow flex flex-col justify-center p-5 text-center bg-white dark:bg-[#121212]">
                    <h3 className="font-montserrat font-bold text-[14px] lg:text-[15px] leading-tight text-gray-900 dark:text-gray-100">
                      {member.name}
                    </h3>
                    {/* ENHANCED ROLE LABEL */}
                    <p className="font-inter text-[11px] font-semibold uppercase tracking-wider mt-2 text-[var(--color-brand-orange)] opacity-90">
                      {member.role}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {isRevealed && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsRevealed(false)}
          className="mt-16 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-[var(--color-brand-red)] transition-colors border-b border-transparent hover:border-[var(--color-brand-red)] pb-1"
        >
          ← Return to Overview
        </motion.button>
      )}
    </div>
  );
};

export default OurTeam;
