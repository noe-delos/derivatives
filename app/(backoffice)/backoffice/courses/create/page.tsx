"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createClient } from "@/lib/supabase/client";
import { CoursePreviewCard } from "@/components/course-preview-card";
import { TiptapEditor } from "@/components/editor/tiptap-editor";

interface Category {
  id: string;
  name: string;
}

interface Module {
  id: string;
  name: string;
  order_index: number;
  estimated_time_minutes: number;
}

export default function CreateCoursePage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const supabase = createClient();

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const [courseId, setCourseId] = useState<string | null>(null);

  // Course form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [pictureUrl, setPictureUrl] = useState("");
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [notes, setNotes] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [orderIndex, setOrderIndex] = useState(1);
  const [isPublished, setIsPublished] = useState(false);

  // Modules state
  const [modules, setModules] = useState<Module[]>([]);
  const [showModuleDialog, setShowModuleDialog] = useState(false);
  const [currentModule, setCurrentModule] = useState<Partial<Module>>({});

  useEffect(() => {
    loadUser();
    loadCategories();
    loadNextOrderIndex();
  }, []);

  async function loadUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUser(user);
  }

  async function loadCategories() {
    try {
      const { data } = await supabase
        .from("categories")
        .select("*")
        .order("name");

      if (data) {
        setCategories(data);
      }
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  }

  async function loadNextOrderIndex() {
    try {
      const { data } = await supabase
        .from("courses")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);

      if (data && data.length > 0) {
        setOrderIndex(data[0].order_index + 1);
      }
    } catch (error) {
      console.error("Error loading order index:", error);
    }
  }

  async function uploadPicture(file: File): Promise<string | null> {
    try {
      setUploadingPicture(true);

      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `course-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("course-pictures")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("Error uploading picture:", error);
        alert(t("course.errorUploadingPicture"));
        return null;
      }

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("course-pictures").getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading picture:", error);
      alert(t("course.errorUploadingPicture"));
      return null;
    } finally {
      setUploadingPicture(false);
    }
  }

  function handlePictureChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        alert(t("course.selectImageFile"));
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(t("course.fileSizeLimit"));
        return;
      }

      setPictureFile(file);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPictureUrl(previewUrl);
    }
  }

  async function saveCourseBasicInfo() {
    if (!title || !categoryId || !difficulty) {
      alert(t("course.fillRequiredFields"));
      return;
    }

    setLoading(true);
    try {
      // Upload picture if one is selected
      let finalPictureUrl = null;
      if (pictureFile) {
        finalPictureUrl = await uploadPicture(pictureFile);
        if (!finalPictureUrl) {
          return; // Upload failed, stop course creation
        }
      }

      // Create course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .insert({
          title,
          description,
          category_id: categoryId,
          picture_url: finalPictureUrl,
          notes,
          difficulty,
          order_index: orderIndex,
          is_published: false, // Always draft initially
          created_by: user?.id,
        })
        .select()
        .single();

      if (courseError) throw courseError;

      setCourseId(course.id);
      // Redirect to course detail page instead of step 2
      router.push(`/backoffice/courses/${course.id}`);
    } catch (error) {
      console.error("Error creating course:", error);
      alert(t("course.errorCreating"));
    } finally {
      setLoading(false);
    }
  }

  async function createModule() {
    if (!currentModule.name || !courseId) return;

    try {
      const { data: createdModule, error: moduleError } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseId,
          name: currentModule.name,
          order_index: modules.length + 1,
          estimated_time_minutes: currentModule.estimated_time_minutes || 0,
        })
        .select()
        .single();

      if (moduleError) throw moduleError;

      const newModule: Module = {
        id: createdModule.id,
        name: createdModule.name,
        order_index: createdModule.order_index,
        estimated_time_minutes: createdModule.estimated_time_minutes,
      };

      setModules([...modules, newModule]);
      setCurrentModule({});
      setShowModuleDialog(false);
    } catch (error) {
      console.error("Error creating module:", error);
      alert(t("course.errorCreating"));
    }
  }

  async function deleteModule(moduleId: string) {
    try {
      await supabase.from("course_modules").delete().eq("id", moduleId);

      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  }

  async function finishCourseCreation() {
    if (!courseId) return;

    setLoading(true);
    try {
      // Update course to published if requested
      if (isPublished) {
        await supabase
          .from("courses")
          .update({ is_published: true })
          .eq("id", courseId);
      }

      router.push("/backoffice/courses");
    } catch (error) {
      console.error("Error finishing course creation:", error);
      alert(t("course.errorCreating"));
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    {
      number: 1,
      title: t("backoffice.courseInformation"),
      completed: currentStep > 1,
    },
    { number: 2, title: t("backoffice.courseModules"), completed: false },
  ];

  // Build preview course object - only use values, don't pass undefined
  const previewCourse = {
    ...(title && { title }),
    ...(description && { description }),
    ...(categoryId &&
      categories.find((c) => c.id === categoryId) && {
        category: categories.find((c) => c.id === categoryId),
      }),
    ...(pictureUrl && { picture_url: pictureUrl }),
    ...(difficulty && { difficulty }),
    created_at: new Date().toISOString(),
    _count: {
      course_modules: modules.length,
      course_registrations: 0,
    },
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.back()}>
            <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
            {t("common.back")}
          </Button>
          <div>
            <h1 className="text-3xl font-din-semibold text-gray-900">
              {t("backoffice.createCourse")}
            </h1>
            <p className="text-gray-600 mt-2">
              {t("backoffice.createCourseDescription")}
            </p>
          </div>
        </div>

        {/* Stepper - smaller on top right */}
        <div className="flex items-center space-x-4">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div
                className={`flex items-center justify-center w-6 h-6 rounded-full border ${
                  step.number === currentStep
                    ? "border-blue-600 bg-blue-600 text-white"
                    : step.completed
                    ? "border-green-600 bg-green-600 text-white"
                    : "border-gray-300 text-gray-500"
                }`}
              >
                {step.completed ? (
                  <Icon icon="mdi:check" className="h-3 w-3" />
                ) : (
                  <span className="text-xs">{step.number}</span>
                )}
              </div>
              <span
                className={`ml-1 text-xs font-medium ${
                  step.number === currentStep
                    ? "text-blue-600"
                    : step.completed
                    ? "text-green-600"
                    : "text-gray-500"
                }`}
              >
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div
                  className={`ml-2 w-6 h-0.5 ${
                    step.completed ? "bg-green-600" : "bg-gray-300"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Course Information */}
      {currentStep === 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form on the left (3/5 width) */}
          <div className="lg:col-span-3 space-y-6">
            <h2 className="text-xl font-semibold mb-6">
              {t("backoffice.courseInformation")}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="title">
                  {t("backoffice.title")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("course.courseTitlePlaceholder")}
                  className="py-5 rounded-xl shadow-soft bg-background"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">
                  {t("common.category")} <span className="text-red-500">*</span>
                </Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger className="py-5 rounded-xl shadow-soft bg-background">
                    <SelectValue placeholder={t("course.selectCategory")} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty">
                  {t("common.difficulty")}{" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger className="py-5 rounded-xl shadow-soft bg-background">
                    <SelectValue placeholder={t("course.selectDifficulty")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">
                      {t("common.beginner")}
                    </SelectItem>
                    <SelectItem value="Intermediate">
                      {t("common.intermediate")}
                    </SelectItem>
                    <SelectItem value="Advanced">
                      {t("common.advanced")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="orderIndex">{t("common.order")}</Label>
                <Input
                  id="orderIndex"
                  type="number"
                  value={orderIndex}
                  onChange={(e) => setOrderIndex(parseInt(e.target.value))}
                  min="1"
                  className="py-5 rounded-xl shadow-soft bg-background"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("common.description")}</Label>
              <div className="rounded-xl shadow-soft bg-background">
                <TiptapEditor
                  content={description}
                  onChange={setDescription}
                  placeholder={t("course.courseDescriptionPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="picture">{t("course.coursePicture")}</Label>
              <div className="space-y-4">
                <div
                  className={`relative w-full h-48 border-2 border-dashed rounded-xl transition-colors cursor-pointer ${
                    pictureUrl
                      ? "border-gray-300 bg-gray-50"
                      : "border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100"
                  }`}
                  onClick={() => document.getElementById("picture")?.click()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith("image/")) {
                      const event = { target: { files: [file] } } as any;
                      handlePictureChange(event);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                >
                  {pictureUrl ? (
                    <>
                      <img
                        src={pictureUrl}
                        alt={t("course.previewAlt")}
                        className="w-full h-full object-cover rounded-xl"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 bg-red-500/80 text-white hover:bg-red-600/90 backdrop-blur-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPictureFile(null);
                          setPictureUrl("");
                        }}
                      >
                        <Icon icon="mdi:close" className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <img
                        src="/image-placeholder.png"
                        alt="Upload placeholder"
                        className="w-10 h-10 mb-3 opacity-60"
                      />
                      <p className="text-sm font-medium mb-1">
                        {t("course.clickToUpload")}
                      </p>
                      <p className="text-xs text-gray-400">
                        {t("course.dragAndDropSupported")}
                      </p>
                    </div>
                  )}
                </div>
                <Input
                  id="picture"
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  className="hidden"
                />
                {uploadingPicture && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Icon icon="mdi:loading" className="animate-spin h-4 w-4" />
                    {t("course.uploadingPicture")}
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  {t("course.pictureRequirements")}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t("backoffice.notes")}</Label>
              <div className="rounded-xl shadow-soft bg-background">
                <TiptapEditor
                  content={notes}
                  onChange={setNotes}
                  placeholder={t("course.courseNotesPlaceholder")}
                />
              </div>
            </div>
          </div>

          {/* Preview on the right (2/5 width) */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-semibold">{t("backoffice.preview")}</h3>
            <div className="scale-75 origin-top">
              <CoursePreviewCard
                course={previewCourse}
                userProgress={0}
                completionRate={0}
                isDisabled={true}
                isPreview={true}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={saveCourseBasicInfo} disabled={loading}>
                {loading ? (
                  <Icon
                    icon="mdi:loading"
                    className="animate-spin h-4 w-4 mr-2"
                  />
                ) : (
                  <Icon icon="mdi:arrow-right" className="h-4 w-4 mr-2" />
                )}
                {t("common.next")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Modules */}
      {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("backoffice.courseModules")}
              <Button onClick={() => setShowModuleDialog(true)}>
                <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                {t("course.addModule")}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="text-center py-12">
                <Icon
                  icon="mdi:book-outline"
                  className="h-16 w-16 text-gray-400 mx-auto mb-4"
                />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {t("course.noModules")}
                </h3>
                <p className="text-gray-500 mb-4">
                  {t("course.addFirstModule")}
                </p>
                <Button onClick={() => setShowModuleDialog(true)}>
                  <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                  {t("course.addModule")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {modules.map((module) => (
                  <Card
                    key={module.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <Badge variant="outline">
                          Module {module.order_index}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteModule(module.id)}
                          className="h-6 w-6 text-red-500 hover:text-red-700"
                        >
                          <Icon icon="mdi:delete" className="h-4 w-4" />
                        </Button>
                      </div>
                      <h4 className="font-medium mb-2">{module.name}</h4>
                      <p className="text-sm text-gray-500">
                        {module.estimated_time_minutes} {t("common.minutes")}
                      </p>
                    </CardContent>
                  </Card>
                ))}

                {/* Add Module Card */}
                <Card
                  className="hover:shadow-md transition-shadow cursor-pointer border-dashed border-2 border-gray-300"
                  onClick={() => setShowModuleDialog(true)}
                >
                  <CardContent className="p-4 flex items-center justify-center h-full">
                    <div className="text-center">
                      <Icon
                        icon="mdi:plus"
                        className="h-8 w-8 text-gray-400 mx-auto mb-2"
                      />
                      <p className="text-gray-500 text-sm">
                        {t("course.addModule")}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            <div className="flex justify-between mt-8">
              <Button variant="outline" onClick={() => setCurrentStep(1)}>
                <Icon icon="mdi:arrow-left" className="h-4 w-4 mr-2" />
                {t("common.back")}
              </Button>

              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublished"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="isPublished">
                    {t("course.publishCourse")}
                  </Label>
                </div>

                <Button onClick={finishCourseCreation} disabled={loading}>
                  {loading ? (
                    <Icon
                      icon="mdi:loading"
                      className="animate-spin h-4 w-4 mr-2"
                    />
                  ) : (
                    <Icon icon="mdi:check" className="h-4 w-4 mr-2" />
                  )}
                  {t("common.finish")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Module Dialog */}
      <Dialog open={showModuleDialog} onOpenChange={setShowModuleDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("course.addModule")}</DialogTitle>
            <DialogDescription>
              {t("course.addModuleDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="moduleName">{t("course.moduleName")}</Label>
              <Input
                id="moduleName"
                value={currentModule.name || ""}
                onChange={(e) =>
                  setCurrentModule({ ...currentModule, name: e.target.value })
                }
                placeholder={t("course.moduleNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="estimatedTime">
                {t("course.estimatedTimeMinutes")}
              </Label>
              <Input
                id="estimatedTime"
                type="number"
                value={currentModule.estimated_time_minutes || ""}
                onChange={(e) =>
                  setCurrentModule({
                    ...currentModule,
                    estimated_time_minutes: parseInt(e.target.value),
                  })
                }
                placeholder={t("course.defaultDurationPlaceholder")}
              />
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowModuleDialog(false)}
            >
              {t("common.cancel")}
            </Button>
            <Button onClick={createModule}>
              <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
              {t("course.addModule")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
