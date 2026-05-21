import AppRouter from './routes/AppRouter';
import { BookingProvider } from './context/BookingContext';
import './App.css';

function App() {
  return (
    <BookingProvider>
      <div className="app">
        <AppRouter />
      </div>
    </BookingProvider>
  );
}

export default App;