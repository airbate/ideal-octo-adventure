// Skill data configuration file
// Used to manage data for the skill display page

export interface Skill {
	id: string;
	name: string;
	description: string;
	icon: string; // Iconify icon name
	category: "frontend" | "backend" | "tools" | "other";
	level: "beginner" | "intermediate" | "advanced" | "expert";
	experience: {
		years: number;
		months: number;
	};
	projects?: string[]; // Related project IDs
	certifications?: string[];
	color?: string; // Skill card theme color
}

export const skillsData: Skill[] = [
	// Frontend Skills
	{
		id: "javascript",
		name: "JavaScript",
		description:
			"Frontend development with modern JavaScript, including ES6+ syntax and DOM manipulation.",
		icon: "logos:javascript",
		category: "frontend",
		level: "intermediate",
		experience: { years: 1, months: 6 },
		projects: ["personal-website", "web-app"],
		color: "#F7DF1E",
	},
	{
		id: "html5",
		name: "HTML5",
		description:
			"Web page structure and semantic markup using HTML5 standards and best practices.",
		icon: "logos:html5",
		category: "frontend",
		level: "intermediate",
		experience: { years: 1, months: 8 },
		projects: ["personal-website", "web-pages"],
		color: "#E34F26",
	},
	{
		id: "css3",
		name: "CSS3",
		description:
			"Styling web pages with CSS3, including flexbox, grid layout, and responsive design principles.",
		icon: "logos:css3",
		category: "frontend",
		level: "intermediate",
		experience: { years: 1, months: 8 },
		projects: ["personal-website", "web-pages"],
		color: "#1572B6",
	},
	{
		id: "vue",
		name: "Vue.js",
		description:
			"Frontend framework for building user interfaces with component-based architecture.",
		icon: "logos:vue",
		category: "frontend",
		level: "beginner",
		experience: { years: 0, months: 6 },
		projects: ["simple-web-app"],
		color: "#4FC08D",
	},
	{
		id: "tailwindcss",
		name: "Tailwind CSS",
		description:
			"Utility-first CSS framework for rapidly building modern user interfaces.",
		icon: "logos:tailwindcss-icon",
		category: "frontend",
		level: "beginner",
		experience: { years: 0, months: 4 },
		projects: ["personal-website"],
		color: "#06B6D4",
	},
	{
		id: "vite",
		name: "Vite",
		description:
			"Next-generation frontend build tool with fast cold starts and hot updates.",
		icon: "logos:vitejs",
		category: "frontend",
		level: "beginner",
		experience: { years: 0, months: 3 },
		projects: ["vue-project"],
		color: "#646CFF",
	},

	// Embedded & Backend Skills
	{
		id: "c",
		name: "C",
		description:
			"Low-level systems programming language, with foundation in embedded systems development and algorithm implementation.",
		icon: "logos:c",
		category: "backend",
		level: "intermediate",
		experience: { years: 1, months: 6 },
		projects: ["embedded-system", "algorithm-implementation"],
		color: "#A8B9CC",
	},
	{
		id: "embedded-c",
		name: "Embedded C",
		description:
			"C programming specifically for embedded systems, including microcontroller programming and hardware interfacing.",
		icon: "logos:c",
		category: "backend",
		level: "intermediate",
		experience: { years: 1, months: 2 },
		projects: ["microcontroller-project", "hardware-interface"],
		color: "#0066CC",
	},
	{
		id: "arm-cortex",
		name: "ARM Cortex-M",
		description:
			"ARM Cortex-M series microcontroller architecture and programming.",
		icon: "simple-icons:arm",
		category: "backend",
		level: "beginner",
		experience: { years: 0, months: 8 },
		projects: ["embedded-controller"],
		color: "#0091BD",
	},
	{
		id: "embedded-systems",
		name: "Embedded Systems",
		description:
			"Design and development of embedded systems, including hardware-software integration and real-time applications.",
		icon: "simple-icons:raspberrypi",
		category: "backend",
		level: "intermediate",
		experience: { years: 1, months: 0 },
		projects: ["embedded-project", "iot-device"],
		color: "#A22B55",
	},
	{
		id: "arduino",
		name: "Arduino",
		description:
			"Open-source electronics platform for rapid prototyping and embedded system development.",
		icon: "simple-icons:arduino",
		category: "backend",
		level: "intermediate",
		experience: { years: 0, months: 10 },
		projects: ["prototyping", "iot-project"],
		color: "#00979D",
	},
	{
		id: "stm32",
		name: "STM32",
		description:
			"STM32 microcontroller programming and development for embedded applications.",
		icon: "simple-icons:stmicroelectronics",
		category: "backend",
		level: "beginner",
		experience: { years: 0, months: 6 },
		projects: ["microcontroller-project"],
		color: "#03234B",
	},
	{
		id: "electronics",
		name: "Electronics",
		description:
			"Basic electronics knowledge, circuit design, and hardware troubleshooting.",
		icon: "simple-icons:electron",
		category: "backend",
		level: "intermediate",
		experience: { years: 1, months: 4 },
		projects: ["circuit-design", "hardware-development"],
		color: "#47848F",
	},
	{
		id: "rtos",
		name: "RTOS",
		description:
			"Real-Time Operating Systems concepts and implementation in embedded systems.",
		icon: "simple-icons:redhat",
		category: "backend",
		level: "beginner",
		experience: { years: 0, months: 4 },
		projects: ["real-time-application"],
		color: "#EE0000",
	},

	// Tools
	{
		id: "git",
		name: "Git",
		description:
			"Distributed version control system for code management and collaboration.",
		icon: "logos:git-icon",
		category: "tools",
		level: "intermediate",
		experience: { years: 1, months: 0 },
		color: "#F05032",
	},
	{
		id: "vscode",
		name: "VS Code",
		description:
			"Lightweight but powerful code editor for embedded and frontend development with rich plugin ecosystem.",
		icon: "logos:visual-studio-code",
		category: "tools",
		level: "advanced",
		experience: { years: 1, months: 6 },
		color: "#007ACC",
	},
	{
		id: "keil",
		name: "Keil µVision",
		description:
			"IDE for ARM Cortex-M microcontroller development and embedded systems programming.",
		icon: "simple-icons:microsoft",
		category: "tools",
		level: "beginner",
		experience: { years: 0, months: 6 },
		projects: ["embedded-development"],
		color: "#00A4EF",
	},
	{
		id: "linux",
		name: "Linux",
		description:
			"Linux operating system fundamentals for embedded development and general programming.",
		icon: "logos:linux-tux",
		category: "tools",
		level: "beginner",
		experience: { years: 0, months: 8 },
		projects: ["embedded-linux"],
		color: "#FCC624",
	},
	{
		id: "circuit-design",
		name: "Circuit Design Tools",
		description:
			"Tools for designing and simulating electronic circuits, including schematic capture and PCB layout.",
		icon: "simple-icons:autodesk",
		category: "tools",
		level: "beginner",
		experience: { years: 0, months: 6 },
		projects: ["circuit-design"],
		color: "#003399",
	},
	{
		id: "debugging",
		name: "Embedded Debugging",
		description:
			"Techniques and tools for debugging embedded systems and microcontroller applications.",
		icon: "simple-icons:bugatti",
		category: "tools",
		level: "beginner",
		experience: { years: 0, months: 8 },
		projects: ["embedded-development"],
		color: "#1F1F1F",
	},
	// Physics Knowledge
	{	
		id: "physics-optics",
		name: "光学",
		description:
			"物理学中的光学分支，包括几何光学、波动光学和量子光学基础知识，以及光学系统设计原理。",
		icon: "material-symbols:lightbulb",
		category: "other",
		level: "intermediate",
		experience: { years: 2, months: 0 },
		projects: ["optical-system"],
		color: "#FFD700",
	},
	{	
		id: "physics-materials",
		name: "材料学",
		description:
			"材料科学基础，包括材料的结构、性能、制备工艺及其在工程中的应用，特别是电子材料和光学材料。",
		icon: "material-symbols:layers",
		category: "other",
		level: "intermediate",
		experience: { years: 1, months: 6 },
		projects: ["material-research"],
		color: "#4CAF50",
	},
];

// Get skill statistics
export const getSkillStats = () => {
	const total = skillsData.length;
	const byLevel = {
		beginner: skillsData.filter((s) => s.level === "beginner").length,
		intermediate: skillsData.filter((s) => s.level === "intermediate").length,
		advanced: skillsData.filter((s) => s.level === "advanced").length,
		expert: skillsData.filter((s) => s.level === "expert").length,
	};
	const byCategory = {
		frontend: skillsData.filter((s) => s.category === "frontend").length,
		backend: skillsData.filter((s) => s.category === "backend").length,
		database: skillsData.filter((s) => s.category === "database").length,
		tools: skillsData.filter((s) => s.category === "tools").length,
		other: skillsData.filter((s) => s.category === "other").length,
	};

	return { total, byLevel, byCategory };
};

// Get skills by category
export const getSkillsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return skillsData;
	}
	return skillsData.filter((s) => s.category === category);
};

// Get advanced skills
export const getAdvancedSkills = () => {
	return skillsData.filter(
		(s) => s.level === "advanced" || s.level === "expert",
	);
};

// Calculate total years of experience
export const getTotalExperience = () => {
	const totalMonths = skillsData.reduce((total, skill) => {
		return total + skill.experience.years * 12 + skill.experience.months;
	}, 0);
	return {
		years: Math.floor(totalMonths / 12),
		months: totalMonths % 12,
	};
};
