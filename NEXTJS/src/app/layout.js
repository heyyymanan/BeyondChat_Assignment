import { Inter } from "next/font/google";
import "./globals.css";
import Image from "next/image";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BeyondChats | Content Manager",
  description: "Assignment Phase 3 Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-slate-950 text-slate-200 antialiased h-screen flex overflow-hidden`}
      >
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
          <div className="p-6 border-b border-slate-800 flex justify-center items-center gap-2">
            <div className=" flex items-center justify-center ">
              {/* Replace this Icon with actual SVG Logo later */}
              <Image preload src={'https://beyondchats.com/wp-content/uploads/2023/12/Beyond_Chats_Logo-removebg-preview.png'} alt="logo" height={50} width={50} />
            </div>
            <h1 className="text-2xl font-bold text-indigo-500 tracking-tight">
              BeyondChats
            </h1>
          </div>

          <div className="flex-1 p-4">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
              Menu
            </div>
            <nav>
              <div className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-white bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                Dashboard
              </div>
            </nav>
          </div>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold text-white">
                MV
              </div>
              <div>
                <p className="text-sm font-medium text-white">Developer - Manan Vyas</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {children}
        </div>
      </body>
    </html>
  );
}
