import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

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
    role: "Team Lead & Data Visualization Engineer",
    contribution: "Builds charts and graphs to display health trends and comparisons. Syncs map interactions with dashboard data and formats backend data for visualization.",
    image: "src/assets/ourTeam/Gevi_image.png",
    hoverImage: "src/assets/ourTeam/Gevi_hoverImage.jpg",
  },
  {
    id: 2,
    name: "Kiel Sebastian A. Dela Cruz",
    role: "Frontend Map Engineer",
    contribution: "Sets up the map system, including provider configuration, base styles, and global boundaries. Handles navigation, markers for outbreaks, and custom controls like zoom and legends.",
    image: "src/assets/ourTeam/Kiel_image.png",
    hoverImage: "src/assets/ourTeam/Kiel_hoverImage.jpg",
  },
  {
    id: 3,
    name: "Ahlyssa Shane D. Dela Cruz",
    role: "Frontend Visualization Engineer",
    contribution: "Applies visual data layers such as choropleth maps and interactive tooltips for health insights. Manages filtering of diseases and optimizes performance for smooth rendering.",
    image: "src/assets/ourTeam/Shane_image.png",
    hoverImage: "src/assets/ourTeam/Shane_hoverImage.jpg",
  },
  {
    id: 4,
    name: "Elijah M. Laquindanum",
    role: "Backend Systems & Database Engineer",
    contribution: "Handles API integrations, user authentication, and database design. Connects frontend and backend through routing while ensuring data security and efficiency.",
    image: "src/assets/ourTeam/Elijah_image.png",
    hoverImage: "src/assets/ourTeam/Elijah_hoverImage.jpg",
  },
  {
    id: 5,
    name: "Leobert V. Jaspe",
    role: "Backend Data & Algorithms Engineer",
    contribution: "Develops the risk scoring model and predictive analytics for health trends. Processes GeoJSON data and calculates metrics like growth rates and forecasts.",
    image: "src/assets/ourTeam/Leobert_image.png",
    hoverImage: "src/assets/ourTeam/Leobert_hoverImage.jpg",
  },
];

const OurTeam: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState(false);

  return (
    <div className="min-h-screen py-20 px-4 flex flex-col items-center">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold font-montserrat text-gray-900 dark:text-white mb-4">
          Meet Our <span className="text-[var(--color-brand-red)]">Team</span>
        </h1>
        <p className="caption text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          The creative minds behind this project. Click the preview to reveal the full crew.
        </p>
      </div>

      <div className="w-full max-w-7xl flex justify-center">
        <AnimatePresence mode="wait">
          {!isRevealed ? (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
              onClick={() => setIsRevealed(true)}
              className="cursor-pointer group relative theme-card rounded-2xl overflow-hidden w-full max-w-2xl h-[400px]"
            >
              <img
                src="src/assets/ourTeam/ourTeam.png"
                alt="Group Preview"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="bg-[var(--color-brand-orange)] text-white px-6 py-2 rounded-full font-bold shadow-lg">
                  Click to Meet Us
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 w-full"
            >
              {teamMembers.map((member) => (
                <motion.div
                  key={member.id}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: member.id * 0.1 }}
                  className="group relative h-[450px] theme-card rounded-xl overflow-hidden flex flex-col shadow-md"
                >
                  {/* Fixed Aspect Image Container */}
                  <div className="relative w-full h-[320px] overflow-hidden bg-gray-200">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                    />
                    <img
                      src={member.hoverImage}
                      alt={`${member.name} action`}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />
                    
                    {/* Lower Opacity Red Overlay with Backdrop Blur */}
                    <div className="absolute inset-0 bg-[var(--color-brand-red)]/40 backdrop-blur-[2px] p-6 flex flex-col justify-center items-center text-center translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out">
                      <h4 className="text-white font-bold mb-2 font-montserrat drop-shadow-md">Contributions</h4>
                      <p className="text-white text-xs leading-relaxed font-custom font-medium drop-shadow-md">
                        {member.contribution}
                      </p>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="flex-grow flex flex-col justify-center p-4 bg-white dark:bg-gray-800 text-center border-t border-gray-100 dark:border-gray-700">
                    <h3 className="font-montserrat font-bold text-sm lg:text-base leading-tight">
                      {member.name}
                    </h3>
                    <p className="text-[var(--color-brand-orange)] text-[10px] font-bold uppercase tracking-tighter mt-1">
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
        <button
          onClick={() => setIsRevealed(false)}
          className="mt-12 text-sm text-gray-400 hover:text-[var(--color-brand-red)] transition-colors underline decoration-dotted"
        >
          View group photo again
        </button>
      )}
    </div>
  );
};

export default OurTeam;