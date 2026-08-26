import type { Metadata } from "next";
import "./globals.css";
export const metadata:Metadata={title:"TRẢI NGHIỆM THẾ GIỚI SỐ",description:"Không gian mô phỏng để học sinh khám phá và tương tác trong thế giới số"};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="vi"><body>{children}</body></html>}
