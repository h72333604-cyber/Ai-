import React, { useState } from 'react';
import {
  Compass,
  ArrowDown,
  Layers,
  ChevronRight,
  Info,
  Droplet,
  Sparkles,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { WATER_TREATMENT_MINDMAP } from '../data/curriculumData';
import { MindMapNode } from '../types';
import { soundEffects } from '../utils/audioEffects';

interface MindMapsViewerProps {
  onAskTutorAboutNode?: (nodeTitle: string) => void;
}

export const MindMapsViewer: React.FC<MindMapsViewerProps> = ({
  onAskTutorAboutNode,
}) => {
  const [activeTab, setActiveTab] = useState<'water' | 'wastewater'>('water');
  const [selectedNode, setSelectedNode] = useState<MindMapNode>(WATER_TREATMENT_MINDMAP[0]);

  const wastewaterSteps: MindMapNode[] = [
    {
      id: 'ww-preliminary',
      title: '1. المعالجة التمهيدية (Preliminary Treatment)',
      description: 'حجز المواد الصلبة الكبيرة والرمال والزيوت العائمة لمنع إتلاف الطلمبات.',
      color: 'from-amber-600 to-yellow-500',
      details: [
        'المصافي الخشنة والمتوسطة (Screens) لإزالة الأقمشة والمخلفات الطافية',
        'حجرات إزالة الرمال (Grit Chambers) بسرعة سريان 0.3 م/ث لترسيب الرمال دون المواد العضوية',
        'مصائد الزيوت والشحوم لتقليل الحمل الهيدروكربوني'
      ],
      substeps: [
        { title: 'التنظيف', detail: 'تنظيف ميكانيكي مستمر للأمشاط لتفادي انسداد القنوات.' },
        { title: 'فحص الهواء', detail: 'حقن هواء خفيف لتسهيل فصل الزيوت.' }
      ]
    },
    {
      id: 'ww-primary',
      title: '2. الترسيب الابتدائي (Primary Sedimentation)',
      description: 'ترسيب المواد الصلبة العالقة القابلة للترسيب ميكانيكياً بدون كيماويات.',
      color: 'from-yellow-600 to-orange-500',
      details: [
        'أحواض ترسيب دائرية أو مستطيلة بكساحات حمأة سفلية وقاشطات رغوة علوية',
        'زمن المكوث الهيدروليكي: من ساعتين إلى 3 ساعات',
        'إزالة 50-65% من المواد الصلبة العالقة (TSS) و30-40% من الحمل العضوي (BOD)'
      ],
      substeps: [
        { title: 'سحب الحمأة', detail: 'ضخ الحمأة الابتدائية الثقيلة لهواضم الحمأة.' },
        { title: 'الطفو', detail: 'قشط الزيوت الطافية بواسطة مساحات السطح.' }
      ]
    },
    {
      id: 'ww-aeration',
      title: '3. المعالجة البيولوجية والحمأة المنشطة (Activated Sludge)',
      description: 'أكسدة المادة العضوية بواسطة البكتيريا الهوائية داخل أحواض التهوية.',
      color: 'from-emerald-600 to-teal-500',
      details: [
        'ضخ الهواء عبر بلاورات وناشرات فقاعية دقيقة (Fine Bubble Diffusers)',
        'الحفاظ على أكسجين ذائب (DO) لا يقل عن 2 مجم/لتر',
        'نسبة الغذاء إلى الميكروبات (F/M Ratio) وزمن المكوث في الحوض 6-8 ساعات'
      ],
      substeps: [
        { title: 'إعادة تدوير الحمأة (RAS)', detail: 'إعادة جزء كبير من الحمأة النشطة للحفاظ على تركيز MLSS.' },
        { title: 'التخلص من الزائد (WAS)', detail: 'تصريف الحمأة الزائدة لوحدات التثخين والتجفيف.' }
      ]
    },
    {
      id: 'ww-secondary-clarifier',
      title: '4. الترسيب النهائي (Secondary Clarifiers)',
      description: 'فصل الكتلة الحيوية والبكتيريا عن المياه المعالجة الرائقة.',
      color: 'from-teal-600 to-cyan-500',
      details: [
        'استقرار ندف البكتيريا في القاع لتجميع الحمأة المنشطة',
        'خروج مياه معالجة ثانوياً بنقاء عالي من الهدارات المسننة',
        'معدل التحميل السطحي الهيدروليكي لا يتجاوز 20-30 م3/م2/يوم'
      ],
      substeps: [
        { title: 'مراقبة العكارة', detail: 'فحص مظهر المياه والندف الهاربة.' }
      ]
    },
    {
      id: 'ww-tertiary',
      title: '5. التطهير بالكلور والمعالجة الثلاثية',
      description: 'إبادة الميكروبات الممرضة وتجهيز المياه لإعادة الاستخدام في ري الغابات الشجرية.',
      color: 'from-cyan-600 to-blue-600',
      details: [
        'أحواض تلامس الكلور بزمن لا يقل عن 20-30 دقيقة',
        'مرشحات قرصية أو رملية لإزالة أدق العوالق المتبقية',
        'المياه المنتجة مطابقة للكود المصري لإعادة استخدام مياه الصرف المعالجة'
      ],
      substeps: [
        { title: 'غابات أسيوط الشجرية', detail: 'استخدام المياه المعالجة في ري المشروعات الشجرية المخصصة.' }
      ]
    }
  ];

  const currentNodes = activeTab === 'water' ? WATER_TREATMENT_MINDMAP : wastewaterSteps;

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="glass-card rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-100">
                الخرائط الذهنية التفاعلية لمناهج محطات مياه أسيوط
              </h2>
              <p className="text-xs text-slate-400">
                تسلسل بصري مترابط لجميع مراحل التنقية والمعالجة يسهل الحفظ السريع
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => {
              setActiveTab('water');
              setSelectedNode(WATER_TREATMENT_MINDMAP[0]);
              soundEffects.playClick();
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'water'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            💧 محطات تنقية مياه الشرب
          </button>
          <button
            onClick={() => {
              setActiveTab('wastewater');
              setSelectedNode(wastewaterSteps[0]);
              soundEffects.playClick();
            }}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'wastewater'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🌱 محطات معالجة الصرف الصحي
          </button>
        </div>
      </div>

      {/* Main Grid: Flowchart Roadmap + Detailed Inspection Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Stages Flow Column */}
        <div className="lg:col-span-7 space-y-3">
          {currentNodes.map((node, index) => {
            const isSelected = selectedNode.id === node.id;
            return (
              <div key={node.id} className="relative">
                <button
                  onClick={() => {
                    setSelectedNode(node);
                    soundEffects.playClick();
                  }}
                  className={`w-full p-4 rounded-2xl border text-right transition-all group flex items-start justify-between gap-4 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-400'
                      : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm text-white bg-gradient-to-br ${node.color} shadow-md flex-shrink-0`}
                    >
                      {index + 1}
                    </div>
                    <div>
                      <h3
                        className={`font-bold text-sm sm:text-base ${
                          isSelected ? 'text-cyan-200' : 'text-slate-100 group-hover:text-cyan-300'
                        }`}
                      >
                        {node.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {node.description}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`p-1 rounded-lg ${
                      isSelected ? 'text-cyan-400' : 'text-slate-600 group-hover:text-slate-400'
                    }`}
                  >
                    <ChevronRight className="w-5 h-5 -scale-x-100" />
                  </span>
                </button>

                {/* Connecting arrow indicator between sequential steps */}
                {index < currentNodes.length - 1 && (
                  <div className="flex justify-center my-1">
                    <ArrowDown className="w-3.5 h-3.5 text-cyan-500/40" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Step Technical Details Inspection Panel */}
        <div className="lg:col-span-5">
          <div className="glass-card rounded-3xl p-6 border border-cyan-500/30 sticky top-24 shadow-xl shadow-cyan-950/20">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-semibold">
                المرحلة النشطة بالخريطة
              </span>
              {onAskTutorAboutNode && (
                <button
                  onClick={() => onAskTutorAboutNode(selectedNode.title)}
                  className="flex items-center gap-1.5 text-xs text-cyan-300 hover:text-white px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>اسأل المدرس الذكي عنها</span>
                </button>
              )}
            </div>

            <h3 className="text-lg font-bold text-white mb-2">{selectedNode.title}</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {selectedNode.description}
            </p>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" /> المعايير الفنية والتشغيلية:
                </h4>
                <ul className="space-y-2">
                  {selectedNode.details.map((item: string, idx: number) => (
                    <li
                      key={idx}
                      className="text-xs text-slate-300 flex items-start gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {selectedNode.substeps && (
                <div>
                  <h4 className="text-xs font-bold text-amber-300 mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> إرشادات التشغيل والمحاذير:
                  </h4>
                  <div className="space-y-2">
                    {selectedNode.substeps.map((sub: { title: string; detail: string }, i: number) => (
                      <div
                        key={i}
                        className="bg-amber-950/20 border border-amber-500/30 p-2.5 rounded-xl text-xs"
                      >
                        <span className="font-bold text-amber-200 block mb-0.5">
                          {sub.title}
                        </span>
                        <span className="text-slate-300">{sub.detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
