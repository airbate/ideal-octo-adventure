// Project data configuration file
// Used to manage data for the project display page

export interface Project {
	id: string;
	title: string;
	description: string;
	image: string;
	category: "web" | "mobile" | "desktop" | "other" | "electronic devices";
	techStack: string[];
	status: "completed" | "in-progress" | "planned";
	liveDemo?: string;
	sourceCode?: string;
	startDate: string;
	endDate?: string;
	featured?: boolean;
	tags?: string[];
}

export const projectsData: Project[] = [
	{
		id: "glance",
		title: "Glance",
		description:
			"一块立在显示器旁边的反射屏（RLCD/e-paper），配合本地 daemon 与 AI agent hooks，把待办、日程、Git 状态、AI agent 实时动态和热点新闻以 1bpp 帧推送到余光里。支持 Claude Code 工具调用实时投屏，附带桌面宠物 EVE。",
		image: "",
		category: "electronic devices",
		techStack: ["Python", "C++", "ESP32", "Pillow", "tkinter", "Claude Code Hooks", "RLCD", "e-paper"],
		status: "in-progress",
		liveDemo: "https://github.com/airbate/Glance",
		sourceCode: "https://github.com/airbate/Glance",
		startDate: "2026-05-01",
		featured: true,
		tags: ["嵌入式", "IoT", "AI Agent", "电子墨水屏", "桌面宠物"],
	},
	{
		id: "protect one",
		title: "超梦",
		description: "希望可以设计出一款突破现实边界的VR眼镜",
		image: "",
		category: "electronic devices",
		techStack: ["传感器", "边缘计算", "手势识别", "光学系统"],
		status: "planned",
		liveDemo: "https://blog.example.com",
		sourceCode: "https://github.com/airbate/-",
		startDate: "2025-09-01",
		endDate: "",
		featured: true,
		tags: ["光学", "嵌入式开发", "虚拟现实"],
	},
	{
		id: "protect two",
		title: "论坛系统",
		description:
			"Personal portfolio website showcasing project experience and technical skills.",
		image: "",
		category: "web",
		techStack: ["React", "Next.js", "TypeScript", "Framer Motion"],
		status: "completed",
		liveDemo: "https://portfolio.example.com",
		sourceCode: "https://github.com/example/portfolio",
		startDate: "2023-08-01",
		endDate: "2023-10-01",
		featured: true,
		tags: ["Portfolio", "React", "Animation"],
	},
	{
		id: "protect three",
		title: "仿生手",
		description: "一款模仿人类手掌结构的机械，希望以此完成一些较为复杂的工作",
		image: "",
		category: "electronic devices",
		techStack: ["React Native", "TypeScript", "Redux", "Firebase"],
		status: "in-progress",
		startDate: "2025-06-01",
		tags: ["Mobile", "Productivity", "Team Collaboration"],
	},
	{
		id: "data-visualization-tool",
		title: "Data Visualization Tool",
		description:
			"Data visualization tool supporting multiple chart types and interactive analysis.",
		image: "",
		category: "web",
		techStack: ["Vue.js", "D3.js", "TypeScript", "Node.js"],
		status: "completed",
		liveDemo: "https://dataviz.example.com",
		startDate: "2023-06-01",
		endDate: "2023-11-01",
		tags: ["Data Visualization", "Analytics", "Charts"],
	},
	{
		id: "e-commerce-platform",
		title: "E-commerce Platform",
		description:
			"Full-stack e-commerce platform including user management, product management, and order processing features.",
		image: "",
		category: "web",
		techStack: ["Next.js", "Node.js", "PostgreSQL", "Stripe"],
		status: "planned",
		startDate: "2024-07-01",
		tags: ["E-commerce", "Full Stack", "Payment Integration"],
	},
	{
		id: "shuimo-liuyun",
		title: "水墨流韵 / Ink Flow",
		description:
			"在宣纸上以指尖作笔的水墨流体模拟。基于 Stam Stable Fluids 算法与 Beer-Lambert 吸光度模型，五种传统中国颜料（玄墨/黛青/朱砂/竹青/藤黄），宣纸底纹、漆扇合成与 PNG 导出。单文件、零依赖、纯 WebGL。",
		image: "/images/posts/shuimo-liuyun/shuimo-fan.jpg",
		category: "web",
		techStack: ["WebGL", "GLSL", "Stable Fluids", "Canvas 2D", "JavaScript"],
		status: "completed",
		liveDemo: "https://shuimo-liuyun.vercel.app",
		sourceCode: "https://github.com/airbate/shuimo-liuyun",
		startDate: "2026-06-14",
		featured: true,
		tags: ["WebGL", "流体模拟", "Shader", "艺术", "单文件"],
	},
	{
		id: "numerologist-skills",
		title: "Numerologist Skills / 赛博半仙的紧箍咒",
		description:
			"给 AI 算命装上确定性计算与规则约束：奇门遁甲、紫微斗数、四柱八字三个 skill。奇门走 Python 刚性排盘脚本，紫微/八字用 references 固定术语口径。目标不是让 LLM 更懂玄学，而是减少它在排盘、流派、判断顺序上的幻觉。",
		image: "",
		category: "other",
		techStack: ["Claude Code Skills", "Python", "lunar_python", "Markdown", "Prompt Engineering"],
		status: "completed",
		liveDemo: "https://github.com/airbate/Numerologist_skills",
		sourceCode: "https://github.com/airbate/Numerologist_skills",
		startDate: "2026-03-25",
		featured: true,
		tags: ["Claude Code", "LLM", "Prompt Engineering", "传统术数", "奇门遁甲", "紫微斗数", "四柱八字"],
	},
];

// Get project statistics
export const getProjectStats = () => {
	const total = projectsData.length;
	const completed = projectsData.filter((p) => p.status === "completed").length;
	const inProgress = projectsData.filter(
		(p) => p.status === "in-progress",
	).length;
	const planned = projectsData.filter((p) => p.status === "planned").length;

	return {
		total,
		byStatus: {
			completed,
			inProgress,
			planned,
		},
	};
};

// Get projects by category
export const getProjectsByCategory = (category?: string) => {
	if (!category || category === "all") {
		return projectsData;
	}
	return projectsData.filter((p) => p.category === category);
};

// Get featured projects
export const getFeaturedProjects = () => {
	return projectsData.filter((p) => p.featured);
};

// Get all tech stacks
export const getAllTechStack = () => {
	const techSet = new Set<string>();
	projectsData.forEach((project) => {
		project.techStack.forEach((tech) => techSet.add(tech));
	});
	return Array.from(techSet).sort();
};
