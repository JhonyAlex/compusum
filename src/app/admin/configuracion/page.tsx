import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { Header } from "@/components/admin/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Globe,
  Phone,
  Share2,
  Search,
  Save,
  Store,
} from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AdminConfigPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Get all settings
  const settings = await db.setting.findMany();
  const settingsMap = settings.reduce((acc, s) => {
    acc[s.key] = s.value;
    return acc;
  }, {} as Record<string, string | null>);

  async function saveSettings(formData: FormData) {
    "use server";

    const entries = Array.from(formData.entries());
    
    for (const [key, value] of entries) {
      if (key === "_group") continue;
      
      const group = formData.get("_group") as string;
      await db.setting.upsert({
        where: { key },
        update: { value: value as string },
        create: { key, value: value as string, group, type: "text" },
      });
    }

    revalidatePath("/admin/configuracion");
    revalidatePath("/");
  }

  return (
    <>
      <Header title="Configuración" subtitle="Ajustes generales del sitio" />

      <div className="p-4 sm:p-6">
        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="general">
              <Store className="h-4 w-4 mr-2" />
              General
            </TabsTrigger>
            <TabsTrigger value="contact">
              <Phone className="h-4 w-4 mr-2" />
              Contacto
            </TabsTrigger>
            <TabsTrigger value="social">
              <Share2 className="h-4 w-4 mr-2" />
              Redes
            </TabsTrigger>
            <TabsTrigger value="seo">
              <Search className="h-4 w-4 mr-2" />
              SEO
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>Información del sitio</CardTitle>
                <CardDescription>
                  Configuración general del sitio web
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={saveSettings} className="space-y-4">
                  <input type="hidden" name="_group" value="general" />
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="site_name">Nombre del sitio</Label>
                      <Input
                        id="site_name"
                        name="site_name"
                        defaultValue={settingsMap.site_name || "Compusum"}
                        placeholder="Compusum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Color primario</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          name="primary_color"
                          type="color"
                          defaultValue={settingsMap.primary_color || "#0D4DAA"}
                          className="w-16 h-10 p-1"
                        />
                        <Input
                          defaultValue={settingsMap.primary_color || "#0D4DAA"}
                          placeholder="#0D4DAA"
                          className="flex-1"
                          readOnly
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="logo_url">URL del logo</Label>
                      <Input
                        id="logo_url"
                        name="logo_url"
                        defaultValue={settingsMap.logo_url || ""}
                        placeholder="https://..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="favicon_url">URL del favicon</Label>
                      <Input
                        id="favicon_url"
                        name="favicon_url"
                        defaultValue={settingsMap.favicon_url || ""}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="footer_text">Texto del footer</Label>
                    <Textarea
                      id="footer_text"
                      name="footer_text"
                      defaultValue={settingsMap.footer_text || ""}
                      placeholder="© 2024 Compusum. Todos los derechos reservados."
                      rows={2}
                    />
                  </div>

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar configuración
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Contact Settings */}
          <TabsContent value="contact">
            <Card>
              <CardHeader>
                <CardTitle>Información de contacto</CardTitle>
                <CardDescription>
                  Datos de contacto que se muestran en el sitio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={saveSettings} className="space-y-4">
                  <input type="hidden" name="_group" value="contact" />
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp_global">WhatsApp principal</Label>
                      <Input
                        id="whatsapp_global"
                        name="whatsapp_global"
                        defaultValue={settingsMap.whatsapp_global || ""}
                        placeholder="576063335206"
                      />
                      <p className="text-xs text-slate-500">
                        Número con código de país, sin espacios ni símbolos
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contact_email_global">Email principal</Label>
                      <Input
                        id="contact_email_global"
                        name="contact_email_global"
                        type="email"
                        defaultValue={settingsMap.contact_email_global || ""}
                        placeholder="info@compusum.com"
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone_number">Teléfono fijo</Label>
                      <Input
                        id="phone_number"
                        name="phone_number"
                        defaultValue={settingsMap.phone_number || ""}
                        placeholder="606 333-5206"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_full">Dirección completa</Label>
                      <Input
                        id="address_full"
                        name="address_full"
                        defaultValue={settingsMap.address_full || ""}
                        placeholder="Calle 123 # 45-67, Pereira, Risaralda"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar configuración
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Social Settings */}
          <TabsContent value="social">
            <Card>
              <CardHeader>
                <CardTitle>Redes sociales</CardTitle>
                <CardDescription>
                  Enlaces a tus perfiles en redes sociales
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={saveSettings} className="space-y-4">
                  <input type="hidden" name="_group" value="social" />
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="facebook_url">Facebook</Label>
                      <Input
                        id="facebook_url"
                        name="facebook_url"
                        defaultValue={settingsMap.facebook_url || ""}
                        placeholder="https://facebook.com/compusum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="instagram_url">Instagram</Label>
                      <Input
                        id="instagram_url"
                        name="instagram_url"
                        defaultValue={settingsMap.instagram_url || ""}
                        placeholder="https://instagram.com/compusum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tiktok_url">TikTok</Label>
                      <Input
                        id="tiktok_url"
                        name="tiktok_url"
                        defaultValue={settingsMap.tiktok_url || ""}
                        placeholder="https://tiktok.com/@compusum"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="linkedin_url">LinkedIn</Label>
                      <Input
                        id="linkedin_url"
                        name="linkedin_url"
                        defaultValue={settingsMap.linkedin_url || ""}
                        placeholder="https://linkedin.com/company/compusum"
                      />
                    </div>
                  </div>

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar configuración
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings */}
          <TabsContent value="seo">
            <Card>
              <CardHeader>
                <CardTitle>SEO Global</CardTitle>
                <CardDescription>
                  Configuración de meta tags para buscadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form action={saveSettings} className="space-y-4">
                  <input type="hidden" name="_group" value="seo" />
                  
                  <div className="space-y-2">
                    <Label htmlFor="meta_title">Meta título</Label>
                    <Input
                      id="meta_title"
                      name="meta_title"
                      defaultValue={settingsMap.meta_title || ""}
                      placeholder="Compusum | Papelería Mayorista en Pereira"
                    />
                    <p className="text-xs text-slate-500">
                      Máximo 60 caracteres recomendado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_description">Meta descripción</Label>
                    <Textarea
                      id="meta_description"
                      name="meta_description"
                      defaultValue={settingsMap.meta_description || ""}
                      placeholder="Compusum es tu aliado en suministros de papelería escolar, oficina y arte. Distribuimos a negocios en el Eje Cafetero y Norte del Valle."
                      rows={3}
                    />
                    <p className="text-xs text-slate-500">
                      Máximo 160 caracteres recomendado
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meta_keywords">Palabras clave</Label>
                    <Input
                      id="meta_keywords"
                      name="meta_keywords"
                      defaultValue={settingsMap.meta_keywords || ""}
                      placeholder="papelería, mayorista, escolar, oficina, Pereira"
                    />
                    <p className="text-xs text-slate-500">
                      Separadas por coma
                    </p>
                  </div>

                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    <Save className="h-4 w-4 mr-2" />
                    Guardar configuración
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
