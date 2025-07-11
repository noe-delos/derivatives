"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter, useParams } from "next/navigation";
import { Icon } from "@iconify/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { createClient } from "@/lib/supabase/client";
import { CoursePreviewCard } from "@/components/course-preview-card";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Module {
  id: string;
  name: string;
  order_index: number;
  estimated_time_minutes: number;
}

interface Course {
  id: string;
  title: string;
  description: string;
  category_id: string;
  picture_url: string;
  notes: string;
  difficulty: string;
  is_published: boolean;
  category?: { name: string };
  _count?: {
    course_modules: number;
    course_registrations: number;
  };
}

function SortableModule({
  module,
  onDelete,
}: {
  module: Module;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: module.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const { t } = useTranslation();

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div className="p-3 bg-background rounded-xl border border-border shadow-soft">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab hover:cursor-grabbing p-1"
            >
              <Icon icon="mdi:drag" className="h-5 w-5 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline">Module {module.order_index}</Badge>
                <h4 className="font-medium">{module.name}</h4>
              </div>
              <p className="text-sm text-gray-500">
                {module.estimated_time_minutes} {t("common.minutes")}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(module.id)}
            className="h-8 w-8 text-red-500 hover:text-red-700"
          >
            <Icon icon="mdi:delete" className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function CourseDetailPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const courseId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const modulesPerPage = 5;
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadCourseData();
  }, [courseId]);

  async function loadCourseData() {
    try {
      setLoading(true);

      // Load course details
      const { data: courseData, error: courseError } = await supabase
        .from("courses")
        .select(
          `
          *,
          category:categories(name),
          _count:course_registrations(count)
        `
        )
        .eq("id", courseId)
        .single();

      if (courseError) throw courseError;

      // Get registration count
      const { count: registrationCount } = await supabase
        .from("course_registrations")
        .select("*", { count: "exact", head: true })
        .eq("course_id", courseId);

      setCourse({
        ...courseData,
        _count: {
          course_modules: 0,
          course_registrations: registrationCount || 0,
        },
      });

      // Load modules
      const { data: modulesData, error: modulesError } = await supabase
        .from("course_modules")
        .select("*")
        .eq("course_id", courseId)
        .order("order_index");

      if (modulesError) throw modulesError;

      setModules(modulesData || []);

      // Update module count
      setCourse((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                ...prev._count!,
                course_modules: modulesData?.length || 0,
              },
            }
          : null
      );
    } catch (error) {
      console.error("Error loading course data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = modules.findIndex((m) => m.id === active.id);
      const newIndex = modules.findIndex((m) => m.id === over?.id);

      const newModules = arrayMove(modules, oldIndex, newIndex).map(
        (module, index) => ({
          ...module,
          order_index: index + 1,
        })
      );

      setModules(newModules);

      // Update order in database
      try {
        const updates = newModules.map((module) =>
          supabase
            .from("course_modules")
            .update({ order_index: module.order_index })
            .eq("id", module.id)
        );

        await Promise.all(updates);
      } catch (error) {
        console.error("Error updating module order:", error);
        // Reload to restore original order on error
        loadCourseData();
      }
    }
  }

  async function deleteModule(moduleId: string) {
    if (!confirm(t("course.confirmDeleteModule"))) return;

    try {
      await supabase.from("course_modules").delete().eq("id", moduleId);

      setModules(modules.filter((m) => m.id !== moduleId));
    } catch (error) {
      console.error("Error deleting module:", error);
    }
  }

  function navigateToAddModule() {
    router.push(`/backoffice/courses/${courseId}/modules/create`);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Icon icon="mdi:loading" className="animate-spin h-8 w-8" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {t("course.notFound")}
        </h3>
        <Button onClick={() => router.push("/backoffice/courses")}>
          {t("common.back")}
        </Button>
      </div>
    );
  }

  // Pagination
  const totalPages = Math.ceil(modules.length / modulesPerPage);
  const paginatedModules = modules.slice(
    (currentPage - 1) * modulesPerPage,
    currentPage * modulesPerPage
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/backoffice/courses">
              {t("backoffice.courses")}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{course.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Preview on the left */}
        <div>
          <CoursePreviewCard
            course={course}
            userProgress={0}
            completionRate={0}
            isDisabled={true}
          />
        </div>

        {/* Modules list on the right */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              {t("backoffice.courseModules")}
              <Button onClick={navigateToAddModule}>
                <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                {t("course.addModule")}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {modules.length === 0 ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Icon
                  icon="mdi:book-outline"
                  className="h-12 w-12 text-gray-400 mx-auto mb-3"
                />
                <p className="text-gray-500 mb-4">{t("course.noModules")}</p>
                <Button variant="outline" onClick={navigateToAddModule}>
                  <Icon icon="mdi:plus" className="h-4 w-4 mr-2" />
                  {t("course.addModule")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={paginatedModules.map((m) => m.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {paginatedModules.map((module) => (
                      <SortableModule
                        key={module.id}
                        module={module}
                        onDelete={deleteModule}
                      />
                    ))}
                  </SortableContext>
                </DndContext>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <Icon icon="mdi:chevron-left" className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-gray-600">
                      {t("common.page")} {currentPage} {t("common.of")}{" "}
                      {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <Icon icon="mdi:chevron-right" className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
