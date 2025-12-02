import { Ruler, Hammer, ShieldCheck } from "lucide-react";

export default function FeaturesBlock({ data }: { data: any }) {
  const items = data.items || [];
  const icons = [<Ruler key={0} className="w-7 h-7 text-blue-600" />, <Hammer key={1} className="w-7 h-7 text-blue-600" />, <ShieldCheck key={2} className="w-7 h-7 text-blue-600" />];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {items.map((item: any, idx: number) => (
            <div key={idx} className="bg-gray-50 p-8 rounded-3xl border border-gray-100 hover:shadow-lg transition-all">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                {icons[idx % 3]}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">{item.title}</h3>
              <p className="text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}