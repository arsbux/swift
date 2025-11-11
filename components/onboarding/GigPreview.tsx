import { Card, Badge } from '@/components/ui';

interface GigPreviewProps {
  title: string;
  description: string;
  price: string;
  timeline: string;
  userName?: string;
}

export default function GigPreview({ title, description, price, timeline, userName }: GigPreviewProps) {
  return (
    <div className="mt-6">
      <h3 className="text-sm font-medium text-primary mb-3">Preview</h3>
      <Card>
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="accent">Gig</Badge>
            {price && (
              <span className="text-lg font-semibold text-primary">${price}</span>
            )}
            {timeline && (
              <span className="text-sm text-text-secondary">• {timeline}</span>
            )}
          </div>
          
          <div>
            <h4 className="text-xl font-semibold mb-2">{title || 'Your gig title will appear here'}</h4>
            <p className="text-sm text-text-secondary whitespace-pre-wrap line-clamp-3">
              {description || 'Your description will appear here'}
            </p>
          </div>
          
          {userName && (
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-xs font-medium">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-primary">{userName}</span>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

