import { useCreateEvent, useUpdateEvent, useGetEvent, useGetCurrentUser } from "@workspace/api-client-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLocation, useRoute } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { useEffect, useState, useRef } from "react";
import { ArrowLeft, Loader2, Upload } from "lucide-react";

const eventSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Provide a better description"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  location: z.string().min(3, "Location is required"),
  price: z.coerce.number().min(0, "Price must be 0 or positive"),
});

type EventFormType = z.infer<typeof eventSchema>;

export default function EventForm() {
  const [matchEdit, params] = useRoute("/organizer/events/:id/edit");
  const isEditing = !!matchEdit;
  const eventId = isEditing ? parseInt(params.id, 10) : 0;
  
  const [_, setLocation] = useLocation();
  const { data: user, isLoading: userLoading } = useGetCurrentUser({ query: { retry: false } });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EventFormType>({
    resolver: zodResolver(eventSchema),
    defaultValues: { price: 0 }
  });

  const { data: eventToEdit, isLoading: loadingEvent } = useGetEvent(eventId, { 
    query: { enabled: isEditing } 
  });

  useEffect(() => {
    if (eventToEdit) {
      reset({
        title: eventToEdit.title,
        description: eventToEdit.description,
        date: eventToEdit.date,
        time: eventToEdit.time,
        location: eventToEdit.location,
        price: eventToEdit.price,
      });
      if (eventToEdit.imageUrl) {
        setPreviewUrl(eventToEdit.imageUrl);
      }
    }
  }, [eventToEdit, reset]);

  const createMutation = useCreateEvent({
    mutation: {
      onSuccess: () => {
        toast({ title: "Event created successfully!" });
        setLocation("/organizer/dashboard");
      }
    }
  });

  const updateMutation = useUpdateEvent({
    mutation: {
      onSuccess: () => {
        toast({ title: "Event updated successfully!" });
        setLocation("/organizer/dashboard");
      }
    }
  });

  useEffect(() => {
    if (!userLoading && (!user || user.role !== "organizer")) {
      setLocation("/");
    }
  }, [user, userLoading, setLocation]);

  if (!userLoading && (!user || user.role !== "organizer")) {
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: EventFormType) => {
    let imageUrl = eventToEdit?.imageUrl;

    if (selectedFile) {
      const formData = new FormData();
      formData.append("image", selectedFile);
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        if (res.ok) {
          const json = await res.json();
          imageUrl = json.imageUrl;
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    }

    const payload = { ...data, imageUrl };

    if (isEditing) {
      updateMutation.mutate({ eventId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Layout>
      <Button variant="ghost-muted" onClick={() => setLocation("/organizer/dashboard")} className="mb-6 -ml-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
      </Button>

      <div className="max-w-2xl mx-auto">
        <div className="glass-card p-8 md:p-10 rounded-3xl">
          <h1 className="text-3xl font-display font-bold mb-2">
            {isEditing ? "Edit Event" : "Create New Event"}
          </h1>
          <p className="text-muted-foreground mb-8">Fill in the details for your event below.</p>

          {isEditing && loadingEvent ? (
            <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin" /></div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Event Title</label>
                <Input {...register("title")} placeholder="Awesome Tech Conference" error={errors.title?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Description</label>
                <textarea 
                  {...register("description")} 
                  rows={4}
                  className="w-full rounded-xl border-2 border-border bg-background px-4 py-3 text-base focus-visible:outline-none focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/10 transition-colors resize-none"
                  placeholder="Tell people what to expect..."
                />
                {errors.description && <p className="mt-1 text-sm text-destructive">{errors.description.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Date</label>
                  <Input type="date" {...register("date")} error={errors.date?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 ml-1">Time</label>
                  <Input type="time" {...register("time")} error={errors.time?.message} />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Location / Venue</label>
                <Input {...register("location")} placeholder="Convention Center, New York" error={errors.location?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Ticket Price (₹) - Enter 0 for Free</label>
                <Input type="number" min="0" step="1" {...register("price")} placeholder="500" error={errors.price?.message} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5 ml-1">Event Poster / Banner (optional)</label>
                <div 
                  className="mt-1 border-2 border-dashed border-border rounded-xl p-6 flex flex-col items-center justify-center bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                  />
                  
                  {previewUrl ? (
                    <div className="relative w-full max-h-64 rounded-lg overflow-hidden flex items-center justify-center">
                      <img src={previewUrl} alt="Preview" className="max-w-full max-h-64 object-contain" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-medium flex items-center"><Upload className="w-4 h-4 mr-2" /> Change Image</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-sm font-medium">Click to upload image</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG, GIF up to 5MB</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex gap-4">
                <Button type="button" variant="outline" size="lg" className="flex-1" onClick={() => setLocation("/organizer/dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" size="lg" className="flex-1" isLoading={isPending}>
                  {isEditing ? "Save Changes" : "Create Event"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </Layout>
  );
}
