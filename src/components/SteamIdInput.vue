<template>
  <div class="steam-input-container">
    <div class="input-group">      
      <!-- Input Mode -->
      <div v-if="!isValidated" class="input-mode">
        <div class="input-wrapper">
          <input
            id="gamePlatformId"
            v-model="localValue"
            @input="handleInput"
            @paste="handlePaste"
            @keyup.enter="validateInput"
            type="text"
            placeholder="Enter Steam ID/URL or Epic Account ID (e.g., 76561198123456789, fb0d983582f74e7cb4602d9611466e11)"
            class="bg-background text-foreground w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent transition-all duration-200 pr-12"
            :class="{ 'invalid': error }"
          >
          <button
            v-if="localValue"
            @click="validateInput"
            type="button"
            class="validate-button"
            :disabled="isResolving || !localValue.trim()"
            title="Validate Gaming Platform ID"
          >
            <i class="pi pi-check" v-if="!isResolving"></i>
            <i class="pi pi-spin pi-spinner" v-else></i>
          </button>
        </div>
        
        <div v-if="isResolving" class="resolving-message">
          <i class="pi pi-spin pi-spinner"></i>
          Resolving profile ID...
        </div>
          
        <div v-else-if="error" class="error-message">
          <i class="pi pi-exclamation-triangle"></i>
          {{ error }}
        </div>
        
        <div v-else class="help-text p-4">
          <br /><strong>Steam Examples:</strong>
          <br />&nbsp;76561198123456789
          <br />&nbsp;yourusername
          <br />&nbsp;https://steamcommunity.com/profiles/76561198123456789
          <br />&nbsp;https://steamcommunity.com/id/yourusername
          <br /><strong>Epic Games:</strong>
          <br />&nbsp;Epic Account ID (32-character hex): fb0d983582f74e7cb4602d9611466e11
          <br />&nbsp;Find yours at: <a href="https://www.epicgames.com/account/personal?productName=epicgames" target="_blank" class="text-accent hover:underline">Epic Games Account</a>
        </div>
      </div>

      <!-- Profile Display Mode -->
      <div v-else class="profile-display">
        <div class="profile-card">
          <div class="profile-header">
            <div class="profile-avatar" v-if="profileAvatar">
              <img :src="profileAvatar" :alt="profileName || 'Profile Avatar'" />
            </div>
            <div class="profile-info">
              <div class="profile-name">
                <i :class="platformIcon" class="text-success"></i>
                {{ profileName || `Valid ${platformLabel} ID` }}
                <span v-if="hasSavedValue" class="saved-indicator">(saved)</span>
              </div>
              <div class="profile-id">{{ localValue }}</div>
              <div v-if="profileSummary" class="profile-summary">
                {{ profileSummary }}
              </div>
            </div>
          </div>
          <div class="profile-actions">
            <button
              @click="changeProfile"
              type="button"
              class="change-button"
              title="Change Steam ID"
            >
              <i class="pi pi-pencil"></i>
              Change
            </button>
            <a 
              v-if="profileUrl" 
              :href="profileUrl" 
              target="_blank" 
              rel="noopener noreferrer"
              class="profile-link"
            >
              <i class="pi pi-external-link"></i>
              View {{ platformLabel }} Profile
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed, ref, watch, onBeforeUnmount } from 'vue'
import type { GamePlatform } from '../composables/useSteamId'

interface SteamProfile { personaName?: string; profileUrl?: string; avatarUrl?: string; summary?: string }
interface EpicProfile { displayName: string; epicAccountId?: string; profileUrl?: string }
type GameProfile = SteamProfile | EpicProfile

interface Props { modelValue: string; error?: string; isResolving?: boolean; steamProfile?: GameProfile | null }
interface Emits { (e: 'update:modelValue', value: string): void; (e: 'validate'): void; (e: 'reset'): void; (e: 'locked', locked: boolean): void; (e: 'resolving', resolving: boolean): void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const localValue = computed({ get: () => props.modelValue, set: (v: string) => emit('update:modelValue', v) })

const isValidated = computed(() => {
  const steamIdPattern = /^7656119\d{10}$/
  const epicIdPattern = /^[a-f0-9]{32}$/
  const input = (props.modelValue || '').trim().toLowerCase()
  const patternMatch = steamIdPattern.test(props.modelValue || '') || epicIdPattern.test(input)
  const noError = !props.error
  const hasProfile = !!props.steamProfile
  return patternMatch && noError && hasProfile
})

const detectedPlatform = computed((): GamePlatform => {
  const input = (props.modelValue || '').trim().toLowerCase()
  if (/^[a-f0-9]{32}$/.test(input)) return 'epic'
  if (/^7656119\d{10}$/.test(input) || /steamcommunity\.com/.test(input) || input.length > 0) return 'steam'
  return 'steam'
})

const platformIcon = computed(() => detectedPlatform.value === 'epic' ? 'pi pi-shopping-cart' : 'pi pi-users')
const platformLabel = computed(() => detectedPlatform.value === 'epic' ? 'Epic Games' : 'Steam')

const profileName = computed(() => {
  if (!props.steamProfile) return null
  if ('personaName' in props.steamProfile) return props.steamProfile.personaName
  if ('displayName' in props.steamProfile) return props.steamProfile.displayName
  return null
})

const profileAvatar = computed(() => props.steamProfile && 'avatarUrl' in props.steamProfile ? props.steamProfile.avatarUrl : null)
const profileSummary = computed(() => props.steamProfile && 'summary' in props.steamProfile ? (props.steamProfile as any).summary : null)
const profileUrl = computed(() => props.steamProfile ? (props.steamProfile as any).profileUrl || null : null)

const hasSavedValue = computed(() => document.cookie.split(';').some(c => c.trim().startsWith('bl4_steam_id=')))

// helpers to persist the Steam ID in a cookie
function setSavedSteamId(value: string) {
  try {
    // 30 days
    const maxAge = 30 * 24 * 60 * 60
    document.cookie = `bl4_steam_id=${encodeURIComponent(value || '')}; path=/; max-age=${maxAge}`
  } catch (_) {}
}

function deleteSavedSteamId() {
  try {
    // expire immediately
    document.cookie = 'bl4_steam_id=; path=/; max-age=0'
  } catch (_) {}
}

// Lock timers and state
let countdownTimer: ReturnType<typeof setTimeout> | null = null
let intervalTimer: ReturnType<typeof setInterval> | null = null
const countdown = ref(0)
const isLocking = ref(false)
const isLocked = ref(false)
const pasteImmediate = ref(false)

function startLockCountdown() {
  if (isLocked.value) return
  if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null }
  if (intervalTimer) { clearInterval(intervalTimer); intervalTimer = null }
  countdown.value = 3
  isLocking.value = true
  emit('resolving', true)
  intervalTimer = setInterval(() => { countdown.value = Math.max(0, countdown.value - 1) }, 1000)
  countdownTimer = setTimeout(() => {
    if (intervalTimer) { clearInterval(intervalTimer); intervalTimer = null }
    isLocking.value = false
    try { setSavedSteamId(props.modelValue || '') } catch {}
    emit('resolving', false)
    validateInput()
    countdownTimer = null
  }, 3000)
}

function handleInput() {
  // v-model already writes to state via computed setter
  // If the input was just pasted and handled immediately, skip starting the countdown
  if (pasteImmediate.value) return
  if (!props.modelValue || !props.modelValue.trim()) {
    if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null }
    if (intervalTimer) { clearInterval(intervalTimer); intervalTimer = null }
    countdown.value = 0
    isLocking.value = false
    emit('resolving', false)
    if (isLocked.value) { isLocked.value = false; emit('locked', false) }
  try { deleteSavedSteamId() } catch {}
    return
  }
  try { setSavedSteamId(props.modelValue || '') } catch {}
  startLockCountdown()
}

function handlePaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') || ''
  if (!text) return
  // Cancel any running countdown/timers to avoid double-validation
  if (countdownTimer) { clearTimeout(countdownTimer); countdownTimer = null }
  if (intervalTimer) { clearInterval(intervalTimer); intervalTimer = null }
  isLocking.value = false
  pasteImmediate.value = true
  emit('resolving', false)
  emit('update:modelValue', text.trim())
  // Immediately attempt validation on paste (no 3s lock countdown)
  validateInput()
  // Clear the pasteImmediate flag after a short interval to allow normal typing behavior
  setTimeout(() => { pasteImmediate.value = false }, 500)
}

function validateInput() { emit('validate') }

// reflect parent's validation into locked state
watch(() => isValidated.value, (val) => {
  if (val) {
    if (!isLocked.value) { isLocked.value = true; emit('locked', true) }
  } else {
    if (isLocked.value) { isLocked.value = false; emit('locked', false) }
  }
})

onBeforeUnmount(() => {
  if (countdownTimer) clearTimeout(countdownTimer)
  if (intervalTimer) clearInterval(intervalTimer)
})

function changeProfile() { emit('reset') }
</script>

<style scoped>
.steam-input-container {
  width: 100%;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.input-label {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text-color);
  font-weight: 500;
  font-size: 1rem;
}

.required {
  color: var(--red-400);
}

.help-button {
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 2px;
  border-radius: 4px;
  transition: color 0.2s ease;
}

.help-button:hover {
  color: rgb(var(--accent-color));
}

.input-wrapper {
  position: relative;
}

.steam-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(var(--accent-color), 0.3);
  border-radius: 8px;
  background: rgba(var(--accent-color), 0.02);
  color: var(--text-color);
  font-size: 0.95rem;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.steam-input:focus {
  outline: none;
  border-color: rgba(var(--accent-color), 0.6);
  box-shadow: 0 0 0 3px rgba(var(--accent-color), 0.15);
}

.steam-input.invalid {
  border-color: var(--red-400);
  box-shadow: 0 0 0 2px rgba(var(--red-500), 0.1);
}

.validate-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(var(--accent-color), 0.1);
  border: 1px solid rgba(var(--accent-color), 0.3);
  color: rgb(var(--accent-color));
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 4px;
}

.validate-button:hover:not(:disabled) {
  background: rgba(var(--accent-color), 0.2);
  border-color: rgba(var(--accent-color), 0.5);
}

.validate-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.clear-button {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-color-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.clear-button:hover {
  color: var(--text-color);
  background: rgba(var(--surface-100), 0.1);
}

.extracted-info {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--accent-color));
  font-size: 0.9rem;
  padding: 8px 12px;
  background: rgba(var(--accent-color), 0.1);
  border-radius: 6px;
  border: 1px solid rgba(var(--accent-color), 0.2);
}

.resolving-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--accent-color));
  font-size: 0.9rem;
  font-style: italic;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--red-400);
  font-size: 0.9rem;
}

.success-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--accent-color));
  font-size: 0.9rem;
  font-weight: 500;
}

.input-mode {
  width: 100%;
}

.profile-display {
  width: 100%;
}

.profile-card {
  padding: 16px;
  background: rgba(var(--accent-color), 0.05);
  border: 1px solid rgba(var(--accent-color), 0.2);
  border-radius: 12px;
  font-size: 0.9rem;
}

.profile-header {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 12px;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-avatar img {
  width: 56px;
  height: 56px;
  border-radius: 8px;
  border: 2px solid rgba(var(--accent-color), 0.3);
}

.profile-info {
  flex: 1;
}

.profile-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: rgb(var(--accent-color));
  margin-bottom: 4px;
  font-size: 1rem;
}

.profile-id {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  font-family: monospace;
  margin-bottom: 6px;
  padding: 4px 8px;
  background: rgba(var(--text-color-secondary), 0.1);
  border-radius: 4px;
  display: inline-block;
}

.profile-summary {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  line-height: 1.4;
  max-height: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid rgba(var(--accent-color), 0.1);
}

.change-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: rgba(var(--text-color-secondary), 0.1);
  border: 1px solid rgba(var(--text-color-secondary), 0.2);
  color: var(--text-color);
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
}

.change-button:hover {
  background: rgba(var(--text-color-secondary), 0.2);
  border-color: rgba(var(--text-color-secondary), 0.3);
}

.profile-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  color: rgb(var(--accent-color));
  text-decoration: none;
  font-size: 0.85rem;
  border: 1px solid rgba(var(--accent-color), 0.2);
  border-radius: 6px;
  transition: all 0.2s ease;
}

.profile-link:hover {
  background: rgba(var(--accent-color), 0.1);
  border-color: rgba(var(--accent-color), 0.3);
}

.resolving-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: rgb(var(--accent-color));
  font-size: 0.9rem;
  padding: 8px 0;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--red-400);
  font-size: 0.9rem;
  padding: 8px 0;
}

.text-success {
  color: #22c55e;
}

.saved-indicator {
  opacity: 0.7;
  font-size: 0.8rem;
}

.help-text {
  color: var(--text-color-secondary);
  font-size: 0.85rem;
  line-height: 1.4;
}

@media (max-width: 768px) {
  .steam-input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
</style>