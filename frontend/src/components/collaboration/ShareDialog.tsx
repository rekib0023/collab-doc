import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Mail, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
}

type SharePermission = 'view' | 'edit' | 'comment';

const ShareDialog: React.FC<ShareDialogProps> = ({ documentId, documentTitle }) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<SharePermission>('view');
  const [isOpen, setIsOpen] = useState(false);
  const { success, error } = useToast();
  
  // In a real app, this would come from an API
  const shareLink = `${window.location.origin}/documents/${documentId}`;
  
  const handleInvite = async () => {
    if (!email.trim()) {
      error('Validation Error', 'Please enter an email address');
      return;
    }
    
    try {
      // In a real app, this would be an API call
      // await inviteCollaborator(documentId, email, permission);
      
      // Mock success for now
      success('Invitation Sent', `Invitation sent to ${email}`);
      setEmail('');
    } catch (err) {
      error('Invitation Failed', 'Could not send invitation. Please try again.');
    }
  };
  
  const copyLinkToClipboard = () => {
    navigator.clipboard.writeText(shareLink)
      .then(() => success('Link Copied', 'Share link copied to clipboard'))
      .catch(() => error('Copy Failed', 'Could not copy link to clipboard'));
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-1" />
          <span>Share</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Document</DialogTitle>
          <DialogDescription>
            Invite collaborators to "{documentTitle}"
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input
              id="email"
              placeholder="colleague@example.com"
              className="col-span-3"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="permission" className="text-right">
              Permission
            </Label>
            <RadioGroup
              value={permission}
              onValueChange={(value: string) => setPermission(value as SharePermission)}
              className="col-span-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="view" id="view" />
                <Label htmlFor="view">Can view</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="comment" id="comment" />
                <Label htmlFor="comment">Can comment</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="edit" id="edit" />
                <Label htmlFor="edit">Can edit</Label>
              </div>
            </RadioGroup>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Share Link</Label>
            <div className="col-span-3 flex">
              <Input
                readOnly
                value={shareLink}
                className="rounded-r-none"
              />
              <Button
                type="button"
                variant="secondary"
                className="rounded-l-none"
                onClick={copyLinkToClipboard}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            type="button"
            variant="default"
            onClick={handleInvite}
            disabled={!email.trim()}
            className="flex items-center"
          >
            <Mail className="h-4 w-4 mr-1" />
            Invite
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;
