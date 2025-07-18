import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import React from "react";

interface LoadingCardProps {
  lines?: number;
  headerLines?: number;
  footerLines?: number;
}

const LoadingCard: React.FC<LoadingCardProps> = ({
  lines = 2,
  headerLines = 2,
  footerLines = 1,
}) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        {Array(headerLines)
          .fill(0)
          .map((_, i) => (
            <Skeleton 
              key={`header-${i}`} 
              className={`h-${i === 0 ? 5 : 4} w-${i === 0 ? '4/5' : '2/3'} ${i < headerLines - 1 ? 'mb-1' : ''}`} 
            />
          ))}
      </CardHeader>
      <CardContent className="pb-2">
        {Array(lines)
          .fill(0)
          .map((_, i) => (
            <Skeleton 
              key={`content-${i}`} 
              className={`h-4 w-${i === 0 ? 'full' : '2/3'} ${i < lines - 1 ? 'mb-2' : ''}`} 
            />
          ))}
      </CardContent>
      {footerLines > 0 && (
        <CardFooter>
          {Array(footerLines)
            .fill(0)
            .map((_, i) => (
              <Skeleton 
                key={`footer-${i}`} 
                className={`h-4 w-1/2 ${i < footerLines - 1 ? 'mb-1' : ''}`} 
              />
            ))}
        </CardFooter>
      )}
    </Card>
  );
};

export default LoadingCard;
