const CARDS = [
  {
    emoji: "⚡",
    title: "What is EPRA?",
    body: "The Energy & Petroleum Regulatory Authority is Kenya's government body for regulating the energy sector. Every month, EPRA reviews global crude oil prices, the KES/USD exchange rate, and supply costs to set the maximum pump price that petrol stations may charge."
  },
  {
    emoji: "📅",
    title: "How the pricing cycle works",
    body: "Prices are announced on the 14th of each month and take effect from the 15th. Each cycle runs roughly 30 days — from the 15th to the 14th of the following month. Stations cannot legally charge above the EPRA maximum during a cycle."
  },
  {
    emoji: "⛽",
    title: "Which fuel for what?",
    body: "Super Petrol powers most passenger cars, motorcycles (boda bodas), and tuk-tuks. Diesel runs trucks, buses, matatus, generators, and some SUVs. Kerosene (IK) is used in cooking stoves and lamps, especially in rural off-grid households."
  },
  {
    emoji: "💡",
    title: "Tips to spend less on fuel",
    body: "Fill up in the first week of a new cycle when prices are freshest. Keep your tyres at the correct pressure and replace your air filter regularly — these alone can improve fuel economy by 5–10%. Use the estimator above to budget trips before you travel."
  }
];

export default function InfoCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {CARDS.map(card => (
        <div
          key={card.title}
          className="group rounded-2xl border border-white/[0.07] bg-white/[0.02] p-5 transition-all duration-200 hover:bg-white/[0.04] hover:border-white/[0.11]"
        >
          <div className="mb-4 text-2xl">{card.emoji}</div>
          <p className="mb-2 text-sm font-semibold text-stone-200 leading-snug">{card.title}</p>
          <p className="text-xs leading-relaxed text-stone-400">{card.body}</p>
        </div>
      ))}
    </div>
  );
}
