import "./SplashScreen.css";
import logo from "../../assets/logo.png";

export default function SplashScreen() {
  return (
    <div className="splash">
      <img 
        src={logo} 
        alt="The Scene Logo" 
        className="logo flicker-in-1"
      />

    </div>
  );
}