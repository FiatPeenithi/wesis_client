import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Check,
    FileText,
    ExternalLink,
    Eye,
    X,
    ShieldCheck,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import doc2 from '../assets/policy_doc/2.pdf';
import doc3 from '../assets/policy_doc/3.pdf';
import doc4 from '../assets/policy_doc/4.pdf';

interface PolicyItem {
    id: number;
    title: string;
    description: string;
    pdfUrl?: string;
    pdfName?: string;
    docLabel?: string;
}

const POLICY_ITEMS: PolicyItem[] = [
    {
        id: 1,
        title: 'ยืนยันคุณสมบัติผู้เข้าร่วม',
        description: 'ฉันขอยืนยันว่าฉันเป็นเพศหญิง อายุ 18-25 ปี จริง',
    },
    {
        id: 2,
        title: 'เอกสารคำชี้แจงผู้เข้าร่วมการวิจัย',
        description: 'ฉันได้อ่านและเข้าใจรายละเอียดโครงการวิจัย วัตถุประสงค์ และขั้นตอนต่างๆ ตามที่ระบุไว้ในเอกสารคำชี้แจงผู้เข้าร่วมการวิจัย',
        pdfUrl: doc2 || '/assets/policy_doc/2.pdf',
        pdfName: '2.pdf',
        docLabel: 'เอกสารคำชี้แจงผู้เข้าร่วมการวิจัย',
    },
    {
        id: 3,
        title: 'หนังสือแสดงเจตนายินยอมเข้าร่วมการวิจัย',
        description: 'ฉันยินยอมเข้าร่วมการวิจัยนี้ด้วยความสมัครใจตามข้อความใน หนังสือแสดงเจตนายินยอมเข้าร่วมการวิจัย',
        pdfUrl: doc3 || '/assets/policy_doc/3.pdf',
        pdfName: '3.pdf',
        docLabel: 'หนังสือแสดงเจตนายินยอมเข้าร่วมการวิจัย',
    },
    {
        id: 4,
        title: 'ความยินยอมในการจัดเก็บและใช้ข้อมูล',
        description: 'ฉันยินยอมให้จัดเก็บและใช้ข้อมูลในระบบนี้เพื่อการวิจัยและการประสานงานเลิกบุหรี่ไฟฟ้า โดยสามารถถอนความยินยอมได้ทุกเมื่อ',
        pdfUrl: doc4 || '/assets/policy_doc/4.pdf',
        pdfName: '4.pdf',
        docLabel: 'เอกสารการจัดเก็บและใช้ข้อมูล',
    },
];

export default function PolicyPage() {
    const navigate = useNavigate();
    const [checkedItems, setCheckedItems] = useState<{ [key: number]: boolean }>({
        1: false,
        2: false,
        3: false,
        4: false,
    });
    const [activePdf, setActivePdf] = useState<{ url: string; title: string } | null>(null);

    // Close PDF modal on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActivePdf(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const toggleItem = (id: number) => {
        setCheckedItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    const allChecked = checkedCount === 4;

    const handleConsent = () => {
        if (!allChecked) return;
        try {
            localStorage.setItem('wesis_consent', 'true');
            localStorage.setItem('wesis_consent_details', JSON.stringify({
                policy1: checkedItems[1],
                policy2: checkedItems[2],
                policy3: checkedItems[3],
                policy4: checkedItems[4],
            }));
        } catch (e) {
            console.error('Failed to set consent in localStorage', e);
        }
        // Navigate or reload to enter login
        if (navigate) {
            navigate('/login');
        } else {
            window.location.href = '/login';
        }
    };

    return (
        <div className="min-h-screen bg-black text-gray-200 font-sans selection:bg-yellow-400 selection:text-black flex flex-col justify-between">
            {/* Top Navigation Header */}
            <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-yellow-400/20 px-4 md:px-8 py-4">
                <div className="max-w-4xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-yellow-400 text-black flex items-center justify-center font-black text-lg shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                            W
                        </div>
                        <div>
                            <span className="text-yellow-400 font-bold text-sm tracking-wider uppercase block">
                                โครงการวิจัย WE SIS
                            </span>
                            <span className="text-gray-400 text-xs">
                                คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหิดล
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 hidden sm:inline">
                            ความคืบหน้า
                        </span>
                        <div className="px-3 py-1 rounded-full text-xs font-bold border transition-colors duration-300 flex items-center gap-1.5"
                            style={{
                                borderColor: allChecked ? 'rgba(250, 204, 21, 0.6)' : 'rgba(113, 113, 122, 0.4)',
                                backgroundColor: allChecked ? 'rgba(250, 204, 21, 0.15)' : 'rgba(39, 39, 42, 0.6)',
                                color: allChecked ? '#facc15' : '#a1a1aa'
                            }}
                        >
                            {allChecked ? <ShieldCheck className="w-3.5 h-3.5 text-yellow-400" /> : null}
                            <span>{checkedCount} / 4 ข้อ</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12 w-full flex-grow">
                {/* Heading & Instructions */}
                <div className="text-center mb-8 md:mb-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/10 border border-yellow-400/30 text-yellow-400 text-xs font-semibold uppercase tracking-wider mb-3">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        หนังสือแสดงความยินยอมเข้าร่วมการวิจัย (Informed Consent)
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight mb-3">
                        เงื่อนไขและความยินยอมการเข้าร่วมโครงการ
                    </h1>
                    <p className="text-gray-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
                        กรุณาอ่านและตรวจสอบข้อตกลงแต่ละข้ออย่างละเอียด และทำเครื่องหมายถูกให้ครบทั้ง 4 ข้อ เพื่อกดปุ่มยินยอมเข้าร่วมโครงการวิจัย
                    </p>

                    {/* Progress Bar */}
                    <div className="w-full max-w-md mx-auto mt-6 bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
                        <div
                            className="bg-yellow-400 h-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(250,204,21,0.5)]"
                            style={{ width: `${(checkedCount / 4) * 100}%` }}
                        />
                    </div>
                </div>

                {/* Consent Items List */}
                <div className="space-y-4 md:space-y-5">
                    {POLICY_ITEMS.map((item) => {
                        const isChecked = !!checkedItems[item.id];
                        return (
                            <div
                                key={item.id}
                                onClick={() => toggleItem(item.id)}
                                className={`group relative rounded-2xl border p-5 md:p-6 transition-all duration-200 cursor-pointer select-none ${isChecked
                                    ? 'bg-zinc-900/90 border-yellow-400/70 shadow-[0_0_20px_rgba(250,204,21,0.12)]'
                                    : 'bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Custom Checkbox */}
                                    <button
                                        type="button"
                                        aria-label={`เลือกข้อที่ ${item.id}`}
                                        aria-checked={isChecked}
                                        role="checkbox"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleItem(item.id);
                                        }}
                                        className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all duration-200 ${isChecked
                                            ? 'bg-yellow-400 border-yellow-400 text-black shadow-[0_0_12px_rgba(250,204,21,0.4)] scale-105'
                                            : 'border-zinc-600 bg-zinc-800/80 group-hover:border-yellow-400/60 text-transparent'
                                            }`}
                                    >
                                        <Check className={`w-4 h-4 stroke-[3] transition-transform duration-200 ${isChecked ? 'scale-100' : 'scale-0'}`} />
                                    </button>

                                    {/* Text Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-zinc-800 text-yellow-400 border border-zinc-700">
                                                ข้อที่ {item.id}
                                            </span>
                                            {item.pdfUrl && (
                                                <span className="text-xs text-zinc-400 flex items-center gap-1 font-medium">
                                                    <FileText className="w-3.5 h-3.5 text-yellow-400/80" />
                                                    มีเอกสารแนบ PDF
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-base md:text-lg text-white font-medium leading-relaxed">
                                            {item.id}. {item.description}
                                        </p>

                                        {/* PDF Attachment Actions */}
                                        {item.pdfUrl && (
                                            <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2.5">
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActivePdf({
                                                            url: item.pdfUrl!,
                                                            title: item.docLabel || item.description,
                                                        });
                                                    }}
                                                    className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-yellow-400 text-xs md:text-sm font-semibold border border-yellow-400/30 hover:border-yellow-400 transition-all shadow-sm"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                    <span>เปิดอ่านเอกสาร PDF</span>
                                                </button>

                                                <a
                                                    href={item.pdfUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs md:text-sm border border-zinc-700 transition-all"
                                                >
                                                    <span>เปิดแท็บใหม่</span>
                                                    <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                                                </a>

                                                <span className="text-zinc-500 text-xs ml-auto hidden sm:inline">
                                                    [{item.pdfName}]
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Validation Banner if not all checked */}
                {!allChecked && (
                    <div className="mt-6 flex items-center justify-center gap-2 text-zinc-400 text-sm bg-zinc-900/60 border border-zinc-800/80 rounded-xl py-3 px-4 text-center">
                        <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0" />
                        <span>
                            กรุณาคลิกเลือกยืนยันให้ครบทั้ง 4 ข้อ เพื่อเปิดใช้งานปุ่มยินยอมเข้าร่วมโครงการ (เหลืออีก {4 - checkedCount} ข้อ)
                        </span>
                    </div>
                )}
            </main>

            {/* Bottom Sticky Action Footer */}
            <footer className="sticky bottom-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-yellow-400/20 p-4 md:p-6">
                <div className="max-w-md mx-auto flex flex-col items-center gap-2.5">
                    <button
                        type="button"
                        disabled={!allChecked}
                        onClick={handleConsent}
                        className={`w-full py-4 px-6 rounded-full font-bold text-base md:text-lg flex justify-center items-center gap-2.5 transition-all duration-300 ${allChecked
                            ? 'bg-yellow-400 text-black shadow-[0_0_25px_rgba(250,204,21,0.4)] hover:bg-yellow-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
                            : 'bg-zinc-800/90 text-zinc-500 border border-zinc-700/50 cursor-not-allowed opacity-60'
                            }`}
                    >
                        <span>ยินยอมเข้าร่วมโครงการวิจัย</span>
                        {allChecked ? (
                            <ArrowRight className="w-5 h-5 text-black stroke-[2.5]" />
                        ) : (
                            <span className="text-xs bg-zinc-700/80 text-zinc-400 px-2 py-0.5 rounded-full font-medium">
                                {checkedCount}/4
                            </span>
                        )}
                    </button>

                    <p className="text-zinc-500 text-xs text-center leading-normal">
                        การกดยินยอมถือเป็นการลงนามยินยอมทางอิเล็กทรอนิกส์ (Electronic Consent) ตามพระราชบัญญัติว่าด้วยธุรกรรมทางอิเล็กทรอนิกส์
                    </p>
                </div>
            </footer>

            {/* PDF Viewer Modal */}
            {activePdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn">
                    <div
                        className="bg-zinc-900 border border-yellow-400/40 w-full max-w-4xl h-[90vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="px-5 py-4 bg-zinc-950 border-b border-zinc-800 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <FileText className="w-5 h-5 text-yellow-400 flex-shrink-0" />
                                <h3 className="text-sm md:text-base font-bold text-white truncate">
                                    {activePdf.title}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <a
                                    href={activePdf.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-all"
                                >
                                    <span>เปิดในแท็บใหม่</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </a>

                                <button
                                    type="button"
                                    onClick={() => setActivePdf(null)}
                                    aria-label="ปิดหน้าต่าง"
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body: Embedded PDF */}
                        <div className="flex-1 bg-zinc-950 relative flex flex-col">
                            <iframe
                                src={activePdf.url}
                                title={activePdf.title}
                                className="w-full h-full border-0"
                            />
                            {/* Mobile fallback helper */}
                            <div className="sm:hidden p-3 bg-zinc-900 border-t border-zinc-800 text-center">
                                <p className="text-xs text-zinc-400 mb-2">
                                    หากเบราว์เซอร์ไม่แสดงตัวอย่างเอกสาร กรุณาเปิดดูในแท็บใหม่
                                </p>
                                <a
                                    href={activePdf.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-yellow-400 text-black text-xs font-bold"
                                >
                                    <span>เปิดเอกสาร PDF ในแท็บใหม่</span>
                                    <ExternalLink className="w-4 h-4" />
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
