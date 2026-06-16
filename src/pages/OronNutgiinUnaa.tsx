import { useEffect } from 'react';

export default function OronNutgiinUnaa() {
  useEffect(() => {
    document.title = 'Орон нутгийн унаа хайх | NuudelchinTrip';

    const description =
      'Орон нутаг руу явах унаа, сул суудалтай жолооч болон хамт явах чиглэлээ NuudelchinTrip дээрээс хайж олоорой.';

    const meta = document.querySelector("meta[name='description']");
    if (meta) {
      meta.setAttribute('content', description);
    }
  }, []);

  return (
    <main className="min-h-screen px-6 py-16">
      <section className="mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold">Орон нутгийн унаа хайх</h1>

        <p className="mt-6 text-lg">
          NuudelchinTrip нь орон нутаг руу явах зорчигчийг сул суудалтай
          жолоочтой холбох унаа хуваалцах платформ юм.
        </p>

        <p className="mt-4 text-lg">
          Та хот хоорондын чиглэл, явах өдөр, суух болон буух газраа сонгоод
          боломжтой жолоочийн мэдээллийг харах боломжтой.
        </p>

        <h2 className="mt-10 text-2xl font-semibold">Яагаад NuudelchinTrip ашиглах вэ?</h2>

        <ul className="mt-4 list-disc space-y-2 pl-6">
          <li>Орон нутгийн унаа хайхад хялбар</li>
          <li>Сул суудалтай жолоочтой холбогдох боломжтой</li>
          <li>Хот хоорондын чиглэл дээр суурилсан</li>
          <li>Дайвар ачаа илгээх боломжтой</li>
        </ul>

        <a
          href="/"
          className="mt-10 inline-block rounded-xl bg-black px-6 py-3 text-white"
        >
          Унаа хайх
        </a>
      </section>
    </main>
  );
}
