<template>
  <div class="save-folder-upload">
    <div
      class="upload-area"
      :class="{ dragover: isDragOver, uploading }"
      @drop.prevent="handleDrop"
      @dragover.prevent="isDragOver = true"
      @dragleave="isDragOver = false"
    >
      <div v-if="!uploading" class="upload-content">
        <div class="upload-hero" :class="{ 'drag-active': isDragOver }">
          <div class="hero-icon">
            <i class="pi pi-cloud-upload text-foreground"></i>
          </div>
          <div class="hero-copy">
            <p class="eyebrow">Step 1 · Import your progress</p>
            <h3>Drop your Borderlands 4 save folder</h3>
            <p>
              Drag the full save directory or hand-pick <code>.sav</code> / <code>.yaml</code> files. We’ll
              auto-convert whatever we need so you can dive straight into editing.
            </p>
            <div class="hero-badges">
              <span class="badge">Drag &amp; Drop</span>
              <span class="badge">Folder Uploads</span>
              <span class="badge">.sav / .yaml</span>
            </div>
          </div>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <h4>Supported files</h4>
            <ul>
              <li><strong>.sav</strong> — profile.sav, 1.sav, 2.sav (converted server-side)</li>
              <li><strong>.yaml / .yml</strong> — profile.yaml, character.yaml (loaded directly)</li>
            </ul>
          </div>
          <div class="info-card">
            <h4>Typical save paths</h4>
            <ul>
              <li><strong>Windows:</strong> Documents/My Games/Borderlands 4/Saved/SaveGames/&lt;SteamID&gt;/profiles/client/</li>
              <li><strong>Steam Deck &amp; Linux:</strong> ~/.steam/steam/steamapps/compatdata/&lt;AppID&gt;/pfx/drive_c/users/steamuser/Documents/My Games/Borderlands 4/Saved/SaveGames/&lt;SteamID&gt;/profiles/client/</li>
            </ul>
          </div>
          <div class="info-card highlight">
            <h4>Quick heads-up</h4>
            <p>
              Upload limit is 50&nbsp;MB. Mixed folders are fine—we’ll extract just the save data you need.
            </p>
          </div>
        </div>

        <div class="upload-actions">
          <input
            ref="fileInput"
            type="file"
            multiple
            accept=".sav,.yaml,.yml"
            @change="handleFileSelect"
            style="display: none"
          >
          <input
            ref="folderInput"
            type="file"
            webkitdirectory
            @change="handleFolderSelect"
            style="display: none"
          >
          <button @click="folderInput?.click()" class="upload-btn subtle">
            <i class="pi pi-folder-open"></i>
            Browse folder
          </button>
          <button @click="fileInput?.click()" class="upload-btn subtle">
            <i class="pi pi-file"></i>
            Browse files
          </button>
        </div>
      </div>

      <div v-else class="upload-progress">
        <div class="spinner">
          <i class="pi pi-spin pi-spinner"></i>
        </div>
        <span>Processing save files...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  uploading: boolean
}

interface Emits {
  (e: 'upload', files: FileList): void
}

defineProps<Props>()
const emit = defineEmits<Emits>()

const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement>()
const folderInput = ref<HTMLInputElement>()

function handleDrop(event: DragEvent) {
  isDragOver.value = false

  const items = event.dataTransfer?.items
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.kind === 'file') {
        const entry = item.webkitGetAsEntry()
        if (entry?.isDirectory) {
          handleFolderEntry(entry as FileSystemDirectoryEntry)
          return
        }
      }
    }
  }

  const files = event.dataTransfer?.files
  if (files && files.length > 0) {
    emit('upload', files)
  }
}

function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    emit('upload', target.files)
  }
}

function handleFolderSelect(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files && target.files.length > 0) {
    emit('upload', target.files)
  }
}

async function handleFolderEntry(entry: FileSystemDirectoryEntry) {
  const readDirectory = (dirEntry: FileSystemDirectoryEntry): Promise<File[]> => {
    return new Promise((resolve) => {
      const dirReader = dirEntry.createReader()
      dirReader.readEntries(async (entries) => {
        const filePromises = entries
          .map(entry => {
            if (entry.isFile) {
              const fileName = entry.name.toLowerCase()
              const isSupported = fileName.endsWith('.sav') || fileName.endsWith('.yaml') || fileName.endsWith('.yml')
              if (isSupported) {
                return new Promise<File>((resolveFile, rejectFile) => {
                  (entry as FileSystemFileEntry).file(resolveFile, rejectFile)
                })
              }
            }
            return null
          })
          .filter(Boolean) as Promise<File>[]

        const files = await Promise.all(filePromises)
        resolve(files)
      })
    })
  }

  const folderFiles = await readDirectory(entry)
  if (folderFiles.length > 0) {
    const dt = new DataTransfer()
    folderFiles.forEach(file => dt.items.add(file))
    emit('upload', dt.files)
  }
}
</script>

<style scoped>
.save-folder-upload {
  width: 100%;
}

.upload-area {
  border: 2px dashed rgba(var(--accent-color), 0.35);
  border-radius: 18px;
  padding: 2.5rem;
  text-align: center;
  transition: all 0.28s ease;
  background: linear-gradient(135deg, rgba(var(--accent-color), 0.04), rgba(var(--accent-color), 0.02));
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.upload-area::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  background: radial-gradient(circle at top, rgba(var(--accent-color), 0.18), transparent 55%);
  transition: opacity 0.28s ease;
}

.upload-area.dragover {
  border-color: rgb(var(--accent-color));
  transform: translateY(-2px);
  box-shadow: 0 20px 40px -28px rgba(var(--accent-color), 0.65);
}

.upload-area.dragover::after {
  opacity: 1;
}

.upload-area.uploading {
  border-color: rgba(var(--accent-color), 0.55);
  background: rgba(var(--accent-color), 0.07);
}

.upload-content {
  display: flex;
  flex-direction: column;
  gap: 2.25rem;
  width: 100%;
}

.upload-hero {
  display: grid;
  grid-template-columns: minmax(0, 132px) minmax(0, 1fr);
  gap: 1.75rem;
  align-items: center;
  padding: 1.75rem;
  border-radius: 16px;
  background: linear-gradient(140deg, rgba(var(--accent-color), 0.14), rgba(var(--accent-color), 0.04));
  border: 1px solid rgba(var(--accent-color), 0.25);
  box-shadow: 0 16px 40px -28px rgba(var(--accent-color), 0.8);
  transition: all 0.24s ease;
}

.upload-hero.drag-active {
  border-color: rgb(var(--accent-color));
  background: linear-gradient(140deg, rgba(var(--accent-color), 0.35), rgba(var(--accent-color), 0.12));
  box-shadow: 0 25px 60px -30px rgba(var(--accent-color), 0.95);
}

.hero-icon {
  height: 120px;
  width: 120px;
  border-radius: 28px;
  background: linear-gradient(135deg, rgb(var(--accent-color)), rgba(var(--accent-color), 0.6));
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 2.8rem;
  box-shadow: 0 18px 30px -20px rgba(var(--accent-color), 0.9);
}

.hero-copy {
  text-align: left;
}

.hero-copy .eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.12em;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--text-color), 0.65);
  margin-bottom: 0.35rem;
}

.hero-copy h3 {
  font-size: 1.9rem;
  font-weight: 700;
  color: var(--text-color);
  margin-bottom: 0.75rem;
}

.hero-copy p {
  color: var(--text-color-secondary);
  margin-bottom: 1.25rem;
  line-height: 1.6;
}

.hero-copy code {
  font-family: var(--font-mono, "Fira Code", monospace);
  background: rgba(var(--surface-100), 0.25);
  padding: 0.15rem 0.35rem;
  border-radius: 6px;
  color: rgb(var(--accent-color));
  font-size: 0.92em;
}

.hero-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  background: rgba(var(--accent-color), 0.14);
  color: rgb(var(--accent-color));
  border: 1px solid rgba(var(--accent-color), 0.25);
  text-transform: uppercase;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1.5rem;
}

.info-card {
  padding: 1.35rem 1.5rem;
  border-radius: 14px;
  background: rgba(var(--surface-100), 0.09);
  border: 1px solid rgba(var(--accent-color), 0.18);
  text-align: left;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 14px 28px -26px rgba(var(--accent-color), 0.9);
}

.info-card.highlight {
  background: rgba(var(--accent-color), 0.12);
  border-color: rgba(var(--accent-color), 0.35);
}

.info-card h4 {
  margin-bottom: 0.75rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.info-card ul {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.45;
}

.info-card li {
  margin-bottom: 0.4rem;
}

.info-card p {
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.5;
  font-size: 0.92rem;
}

.upload-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.upload-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1.65rem;
  border-radius: 999px;
  border: 1px solid transparent;
  cursor: pointer;
  font-weight: 600;
  font-size: 0.95rem;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease, color 0.18s ease;
}

.upload-btn i {
  font-size: 1rem;
}

.upload-btn.primary {
  background: linear-gradient(130deg, rgb(var(--accent-color)), rgba(var(--accent-color), 0.7));
  color: #fff;
  box-shadow: 0 14px 28px -24px rgba(var(--accent-color), 0.9);
}

.upload-btn.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 18px 34px -24px rgba(var(--accent-color), 0.95);
}

.upload-btn.subtle {
  background: rgba(var(--surface-100), 0.16);
  color: var(--text-color-secondary);
  border-color: rgba(var(--accent-color), 0.22);
}

.upload-btn.subtle:hover {
  background: rgba(var(--accent-color), 0.12);
  color: rgb(var(--accent-color));
  transform: translateY(-2px);
}

.upload-progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: rgb(var(--accent-color));
  font-size: 1.1rem;
}

.spinner i {
  font-size: 2rem;
}

@media (max-width: 900px) {
  .upload-area {
    padding: 2rem 1.5rem;
  }

  .upload-hero {
    grid-template-columns: minmax(0, 1fr);
    text-align: center;
    justify-items: center;
  }

  .hero-copy {
    text-align: center;
  }

  .hero-badges {
    justify-content: center;
  }

  .hero-icon {
    height: 108px;
    width: 108px;
  }
}

@media (max-width: 640px) {
  .upload-area {
    padding: 1.75rem 1.2rem;
    min-height: 280px;
  }

  .upload-content {
    gap: 1.75rem;
  }

  .info-grid {
    gap: 1.1rem;
  }

  .upload-btn {
    width: 100%;
    justify-content: center;
  }
}
</style>