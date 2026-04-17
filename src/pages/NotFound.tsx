import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  useEffect(() => { document.title = "Not found · FlipWise"; }, []);
  return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-4">🤔</div>
        <h1 className="font-display text-3xl font-semibold">Page not found</h1>
        <p className="text-muted-foreground mt-2">That page doesn't exist or has moved.</p>
        <Button asChild className="mt-6">
          <Link to="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
