import WeatherDashboard from "@/components/WeatherDashboard";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-slate-100">
      <main className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-12">
        <WeatherDashboard />
      </main>
    </div>
  );
}
