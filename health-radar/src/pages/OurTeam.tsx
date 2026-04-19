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
    image: "https://scontent.fmnl8-5.fna.fbcdn.net/v/t39.30808-6/476887347_1365367924820663_651945132154229117_n.jpg?_nc_cat=109&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeEi6WASHb8kOBhKPOaHHLLNy9oovp8pRF7L2ii-nylEXljbsCvFUdZ29h7kTE6UI9pinBGTDg8cAZ-iK3f6Bwjx&_nc_ohc=S96yX7jofzoQ7kNvwFJzSDL&_nc_oc=Adqqsg2FAhfxS5_xS4eWMJtn-XsH0xvgG4gjQ1deqFjsGC9BtFKWy1FIZkDaauj4ZgQ&_nc_zt=23&_nc_ht=scontent.fmnl8-5.fna&_nc_gid=BEmq0uRhiDvCo1IHCeFKYg&_nc_ss=7a3a8&oh=00_Af0ap0qb2nTtCDtfiOy_e_hRGglOFuwnsmHhy-5kaoeIXQ&oe=69EA5DFC",
    hoverImage: "https://scontent.fmnl8-6.fna.fbcdn.net/v/t39.30808-6/471686854_1336476901043099_7452853408592666398_n.jpg?_nc_cat=100&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeEhb3irhY2zBQUAaWwfVIDURUUqUOOUFplFRSpQ45QWmRWCUnCkodE2eevssDq6Gl_8fhpULpv6dAkjp78xIt2f&_nc_ohc=99KcWR4oSUUQ7kNvwE8LVo9&_nc_oc=AdooYIMC8lDHRSmYPPp7WkCYaVUsvanUhwWOk_CcZTEnQMVaVaVoOLRDqyIvPKbp3vE&_nc_zt=23&_nc_ht=scontent.fmnl8-6.fna&_nc_gid=fOav7cXhbx1ggD2RNXXWUQ&_nc_ss=7a3a8&oh=00_Af1NWF8i0wfjIWSulU-6wvcS14vmctnmhEQq8rveH6Jnrw&oe=69EA5EF5",
  },
  {
    id: 2,
    name: "Kiel Sebastian A. Dela Cruz",
    role: "Frontend Map Engineer",
    contribution: "Sets up the map system, including provider configuration, base styles, and global boundaries. Handles navigation, markers for outbreaks, and custom controls like zoom and legends.",
    image: "src/assets/ourTeam/Kiel_image.jpg",
    hoverImage: "src/assets/ourTeam/Kiel_hoverImage.jpg",
  },
  {
    id: 3,
    name: "Ahlyssa Shane D. Dela Cruz",
    role: "Frontend Visualization Engineer",
    contribution: "Applies visual data layers such as choropleth maps and interactive tooltips for health insights. Manages filtering of diseases and optimizes performance for smooth rendering.",
    image: "https://scontent.fmnl8-6.fna.fbcdn.net/v/t51.75761-15/496330203_18054074183257770_8632181643755502785_n.webp?stp=dst-jpg_s1080x2048_tt6&_nc_cat=100&ccb=1-7&_nc_sid=d75a4d&_nc_eui2=AeFp85crjX3MCchI5kIbwXe4GZ9GKmVZJXMZn0YqZVklc2U7-y9qmOGrLzGx1IuPm5grKHHUgxptubovDVS2mPGP&_nc_ohc=j33OaIUjwqMQ7kNvwE-5PgO&_nc_oc=AdpCk2zxkF9ZdPbh1iZH5wmFovC0Mret-wxhp3ojGZHuGpn8ABQTFyvuC3Gg4K8H08I&_nc_zt=23&_nc_ht=scontent.fmnl8-6.fna&_nc_gid=75zwtze0C2qIVXhyhC1WQQ&_nc_ss=7a3a8&oh=00_Af1knJ7p75pCtwJvhV6oSlEgeso_0zB8btsJi2LfW2Ckyw&oe=69EA505C",
    hoverImage: "https://scontent.fmnl8-1.fna.fbcdn.net/v/t39.30808-6/641134892_4567201660191295_1183204808758584138_n.jpg?_nc_cat=108&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeG1DAgX_qgV6dBQs84wzMKDpR-iyqI2JPWlH6LKojYk9QdTteYX-Ot84rhy2gaVW4r0kL_FRmyfZmXUJRf5HV5N&_nc_ohc=OXQwW2qpnd4Q7kNvwFqrMj4&_nc_oc=AdpDRXBCGJHES3GqPKxdak3zkpvRjGUO0V7Q5G12NiRkiTn3RE2PPG92YUMe7QynIEA&_nc_zt=23&_nc_ht=scontent.fmnl8-1.fna&_nc_gid=oIDOfZHyDMjCtQDcZRR1jg&_nc_ss=7a3a8&oh=00_Af3w-8nGn9fINZWWQsKSqZH5iduqbMJb0FZPQGzeOJvFkw&oe=69EA3604",
  },
  {
    id: 4,
    name: "Elijah M. Laquindanum",
    role: "Backend Systems & Database Engineer",
    contribution: "Handles API integrations, user authentication, and database design. Connects frontend and backend through routing while ensuring data security and efficiency.",
    image: "https://scontent.fmnl8-3.fna.fbcdn.net/v/t1.6435-9/92203219_619770905241876_8306340654519156736_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeE5onIC9rjfklP4CMqNCPJdexO9xSvKLRp7E73FK8otGvChknXWkzwvT60o_DQb9vPz56I61Bmjh4ukcB3M1Q1S&_nc_ohc=oT6trfRNsXgQ7kNvwFBFu_g&_nc_oc=AdqM9OkwjR3UuOoRg1HuRrpSuKzrDrYxF_iWzAExz6qz3oDSB3Vj_UsCe-EV_MQAFRk&_nc_zt=23&_nc_ht=scontent.fmnl8-3.fna&_nc_gid=_pgrl5jDPTykUTsCA9Miwg&_nc_ss=7a3a8&oh=00_Af32bj5s45PYKgJYNrxqTUmJ0_g4ChtP-1NV2zUU5GyrOw&oe=6A0C038E",
    hoverImage: "https://scontent.fmnl8-3.fna.fbcdn.net/v/t1.6435-9/83594128_576291926256441_8164928688794632192_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeE-rdNg7Ijoh-cjTppIP_8rqK4-__CE6TGorj7_8ITpMSdhJRGqOyxrLCqj03du35nlczhYXvBn1lLiLa-5WSWr&_nc_ohc=ETw5KbsHpXIQ7kNvwGf_jzy&_nc_oc=AdqTDfkN44UC6HA9DbB8kcWF64yKri0v94KvdxwMrI2sDqCgXdn6jlnGq9Keu-C6vCI&_nc_zt=23&_nc_ht=scontent.fmnl8-3.fna&_nc_gid=SW3ISxdUC5lfCyE8tY8ybg&_nc_ss=7a3a8&oh=00_Af2LhnR4jjaNg5IuhKf5Rrfp1BMeQVo3OWT8EeimQTkpmg&oe=6A0BD26A",
  },
  {
    id: 5,
    name: "Leobert V. Jaspe",
    role: "Backend Data & Algorithms Engineer",
    contribution: "Develops the risk scoring model and predictive analytics for health trends. Processes GeoJSON data and calculates metrics like growth rates and forecasts.",
    image: "https://scontent.fmnl8-1.fna.fbcdn.net/v/t39.30808-6/481215931_1702472436998120_5433738607747189656_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=53a332&_nc_eui2=AeGoeD3iC7gONTd3eOZhxNIUyvdvgelelujK92-B6V6W6MnxqJC_Ya5udmDa31H4wVk233uJuWNagjjHn5Vb0LMH&_nc_ohc=vdlubCtQWdQQ7kNvwFvwX5s&_nc_oc=AdqqAuE4Ut6j5D_Faa4fPshrxeJRPR8MmbMZsLSENF1A2jQeabosMbdwkWDHYZLdTAo&_nc_zt=23&_nc_ht=scontent.fmnl8-1.fna&_nc_gid=RJoSZESh3gCvL5_IlSB6MA&_nc_ss=7a3a8&oh=00_Af0sOBM_lGTjzTeeonbFZjg1NRq9buipB6DWtJozy8Q64Q&oe=69EA439F",
    hoverImage: "https://scontent.fmnl8-1.fna.fbcdn.net/v/t39.30808-6/650180285_1989759161602778_109207913972671707_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=1d70fc&_nc_eui2=AeHS24VABtNaxJlSr9yL2HyBFUYUccKmkmYVRhRxwqaSZsxCqFQChnwXjY402mG_jbbl73eC3KC7b5V2yjIapZNs&_nc_ohc=zhlSJjjb3aYQ7kNvwHw49Ls&_nc_oc=AdrK4ulZFhBTvARZjufD2U6qPXUU6I23wBeDEOq2YnG5kD_PyyY9XQn5oowEqq2-ltM&_nc_zt=23&_nc_ht=scontent.fmnl8-1.fna&_nc_gid=B4oMeysz7N_TCoe5jVVM-g&_nc_ss=7a3a8&oh=00_Af29qnB7mfI2GTlSDJm1ggCAiaMAjLVwbX9ETQw96HbqxQ&oe=69EA467A",
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
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200"
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