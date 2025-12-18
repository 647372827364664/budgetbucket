'use client'

export function PromobannerSection() {
  return (
    <section className="container-custom py-12">
      <div className="gradient-bg text-white rounded-lg p-8 md:p-12 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">
          🎊 Festive Mega Sale! 🎊
        </h2>
        <p className="text-lg mb-6 opacity-90">
          Enjoy up to 70% off on selected items. Use code <span className="font-bold">FESTIVAL70</span>
        </p>
        <button className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition">
          Shop Mega Sale
        </button>
      </div>
    </section>
  )
}
