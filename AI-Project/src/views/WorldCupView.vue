<template>
  <div class="worldcup-page">
    <!-- 炫酷动态背景（纯CSS，零JS开销） -->
    <div class="bg-animated">
      <div class="bg-stars"></div>
      <div class="bg-glow bg-glow-1"></div>
      <div class="bg-glow bg-glow-2"></div>
    </div>

    <!-- 页面头部 - AI足球智能体品牌 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-qrcode">
          <img alt="小程序二维码" class="qrcode-img" src="/mini.jpg" width="50" height="50" />
          <span class="qrcode-label">扫码体验小程序</span>
        </div>
        <div class="header-divider"></div>
        <div class="header-brand">
          <img alt="AI足球智能体" class="brand-logo" src="@/assets/logo.svg" width="50" height="50" />
          <div class="brand-title">
            <span class="brand-name">AI足球智能体</span>
            <span class="brand-subtitle">微信搜一搜</span>
          </div>
        </div>
        <div class="header-divider"></div>
        <div class="header-tournament">
          <div class="tournament-icon">🏆</div>
          <div class="tournament-info">
            <h1 class="page-title">2026美加墨世界杯</h1>
            <p class="page-subtitle">晋级之路</p>
          </div>
        </div>
      </div>
    </div>

    <!-- ==================== 晋级预测 ==================== -->
      <!-- 预测阶段Tab -->
      <div class="phase-tabs">
        <div
          class="phase-tab"
          :class="{ active: predictionPhase === 'group' }"
          @click="predictionPhase = 'group'"
        >
          小组赛
        </div>
        <div
          class="phase-tab"
          :class="{ active: predictionPhase === 'knockout', disabled: !canEnterKnockout }"
          @click="canEnterKnockout && (predictionPhase = 'knockout')"
        >
          冠军角逐
        </div>
      </div>

      <!-- 小组赛选择阶段 -->
      <div v-if="predictionPhase === 'group'" class="group-selection">
        <div class="selection-hint">
          <span>点击球队按顺序选择：第1次=第1名，第2次=第2名，第3次=第3名（共选8个）</span>
          <el-tooltip content="每个小组依次点击选择前2名（共24队直接晋级），再选最多8个第三名。第3名选满8个后不可再选。" placement="top">
            <el-icon class="hint-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>

        <div class="progress-bar">
          <div class="progress-text">前2名 {{ selectedTop2Count }}/24 | 第三名 {{ selectedThirdCount }}/8</div>
          <div class="progress-track">
            <div class="progress-fill" :style="{ width: (selectedTop2Count / 24 * 100) + '%' }"></div>
            <div class="progress-fill third" :style="{ width: (selectedThirdCount / 8 * 100) + '%', marginLeft: '4px' }"></div>
          </div>
        </div>

        <div class="groups-grid">
          <div v-for="group in allGroups" :key="group.name" class="group-card">
            <div class="group-card-header">{{ group.name }}</div>
            <div class="group-teams">
              <div
                v-for="team in group.teams"
                :key="team.name"
                class="team-select-row"
                :class="{
                  selected: isTeamSelected(team.name),
                  'rank-1': getTeamSelectionRank(team.name, group.name) === 1,
                  'rank-2': getTeamSelectionRank(team.name, group.name) === 2,
                  'rank-3': getTeamSelectionRank(team.name, group.name) === 3
                }"
                @click="toggleTeamSelection(team.name, group.name)"
              >
                <team-flag :name="team.name" size="small" />
                <span class="team-name">{{ team.name }}</span>
                <span class="select-indicator">
                  <span v-if="getTeamSelectionRank(team.name, group.name)" class="rank-num">
                    {{ getTeamSelectionRank(team.name, group.name) }}
                  </span>
                  <span v-else class="select-circle"></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="selection-actions">
          <el-button
            type="success"
            :disabled="!canEnterKnockout"
            @click="goToKnockout"
          >
            进入冠军角逐 ({{ selectedTop2Count + selectedThirdCount }}/32)
          </el-button>
        </div>
      </div>

      <!-- 淘汰赛预测阶段 -->
      <div v-else class="knockout-stage">
        <div class="knockout-hint">
          <span>点击球队即预测它赢得该场比赛并晋级下一轮</span>
          <el-tooltip content="点击对阵中的球队，预测它赢得该场比赛并晋级" placement="top">
            <el-icon class="hint-icon"><QuestionFilled /></el-icon>
          </el-tooltip>
        </div>

        <!-- ==================== 树状淘汰赛对阵图 ==================== -->
        <div class="bracket-tree">
          <!-- 上半区 -->
          <div class="half-tree">
            <div class="half-tree-title">上半区</div>
            <div class="half-tree-body">
              <!-- 左侧 -->
              <div class="side-tree left-tree">
                <div class="tree-col r16-col">
                  <div v-for="(match, idx) in upperLeft.round16" :key="'ul-r16-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="predictMatch('upperLeft', 'round16', idx, 'home')">
                      <team-flag :name="match.homeTeam" size="small" />
                      <span class="tree-team-name">{{ match.homeTeam }}</span>
                    </div>
                    <div class="tree-team" :class="{ winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="predictMatch('upperLeft', 'round16', idx, 'away')">
                      <team-flag :name="match.awayTeam" size="small" />
                      <span class="tree-team-name">{{ match.awayTeam }}</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col r8-col">
                  <div v-for="(match, idx) in upperLeft.round8" :key="'ul-r8-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': match.homeTeam, winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="match.homeTeam && predictMatch('upperLeft', 'round8', idx, 'home')">
                      <team-flag v-if="match.homeTeam" :name="match.homeTeam" size="small" />
                      <span v-if="match.homeTeam" class="tree-team-name">{{ match.homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': match.awayTeam, winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="match.awayTeam && predictMatch('upperLeft', 'round8', idx, 'away')">
                      <team-flag v-if="match.awayTeam" :name="match.awayTeam" size="small" />
                      <span v-if="match.awayTeam" class="tree-team-name">{{ match.awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col qf-col">
                  <div class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[0].homeTeam, winner: quarterFinals[0].winner === 'home', eliminated: quarterFinals[0].winner === 'away' }" @click="quarterFinals[0].homeTeam && predictQuarterFinal(0, 'home')">
                      <team-flag v-if="quarterFinals[0].homeTeam" :name="quarterFinals[0].homeTeam" size="small" />
                      <span v-if="quarterFinals[0].homeTeam" class="tree-team-name">{{ quarterFinals[0].homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[0].awayTeam, winner: quarterFinals[0].winner === 'away', eliminated: quarterFinals[0].winner === 'home' }" @click="quarterFinals[0].awayTeam && predictQuarterFinal(0, 'away')">
                      <team-flag v-if="quarterFinals[0].awayTeam" :name="quarterFinals[0].awayTeam" size="small" />
                      <span v-if="quarterFinals[0].awayTeam" class="tree-team-name">{{ quarterFinals[0].awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 中间 半决赛 -->
              <div class="semi-center">
                <div class="tree-match semi-match">
                  <div class="tree-team" :class="{ 'has-team': semiFinals[0].homeTeam, winner: semiFinals[0].winner === 'home', eliminated: semiFinals[0].winner === 'away' }" @click="semiFinals[0].homeTeam && predictSemiFinal(0, 'home')">
                    <team-flag v-if="semiFinals[0].homeTeam" :name="semiFinals[0].homeTeam" size="small" />
                    <span v-if="semiFinals[0].homeTeam" class="tree-team-name">{{ semiFinals[0].homeTeam }}</span>
                    <span v-else class="tree-placeholder">?</span>
                  </div>
                  <div class="tree-team" :class="{ 'has-team': semiFinals[0].awayTeam, winner: semiFinals[0].winner === 'away', eliminated: semiFinals[0].winner === 'home' }" @click="semiFinals[0].awayTeam && predictSemiFinal(0, 'away')">
                    <team-flag v-if="semiFinals[0].awayTeam" :name="semiFinals[0].awayTeam" size="small" />
                    <span v-if="semiFinals[0].awayTeam" class="tree-team-name">{{ semiFinals[0].awayTeam }}</span>
                    <span v-else class="tree-placeholder">?</span>
                  </div>
                </div>
              </div>
              <!-- 右侧 -->
              <div class="side-tree right-tree">
                <div class="tree-col qf-col">
                  <div class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[1].homeTeam, winner: quarterFinals[1].winner === 'home', eliminated: quarterFinals[1].winner === 'away' }" @click="quarterFinals[1].homeTeam && predictQuarterFinal(1, 'home')">
                      <team-flag v-if="quarterFinals[1].homeTeam" :name="quarterFinals[1].homeTeam" size="small" />
                      <span v-if="quarterFinals[1].homeTeam" class="tree-team-name">{{ quarterFinals[1].homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[1].awayTeam, winner: quarterFinals[1].winner === 'away', eliminated: quarterFinals[1].winner === 'home' }" @click="quarterFinals[1].awayTeam && predictQuarterFinal(1, 'away')">
                      <team-flag v-if="quarterFinals[1].awayTeam" :name="quarterFinals[1].awayTeam" size="small" />
                      <span v-if="quarterFinals[1].awayTeam" class="tree-team-name">{{ quarterFinals[1].awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col r8-col">
                  <div v-for="(match, idx) in upperRight.round8" :key="'ur-r8-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': match.homeTeam, winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="match.homeTeam && predictMatch('upperRight', 'round8', idx, 'home')">
                      <team-flag v-if="match.homeTeam" :name="match.homeTeam" size="small" />
                      <span v-if="match.homeTeam" class="tree-team-name">{{ match.homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': match.awayTeam, winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="match.awayTeam && predictMatch('upperRight', 'round8', idx, 'away')">
                      <team-flag v-if="match.awayTeam" :name="match.awayTeam" size="small" />
                      <span v-if="match.awayTeam" class="tree-team-name">{{ match.awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col r16-col">
                  <div v-for="(match, idx) in upperRight.round16" :key="'ur-r16-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="predictMatch('upperRight', 'round16', idx, 'home')">
                      <team-flag :name="match.homeTeam" size="small" />
                      <span class="tree-team-name">{{ match.homeTeam }}</span>
                    </div>
                    <div class="tree-team" :class="{ winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="predictMatch('upperRight', 'round16', idx, 'away')">
                      <team-flag :name="match.awayTeam" size="small" />
                      <span class="tree-team-name">{{ match.awayTeam }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 决赛 -->
          <div class="final-tree-block">
            <div class="final-tree-label">🏆 决赛</div>
            <div class="final-tree-match">
              <div class="final-tree-team" :class="{ 'has-team': finalMatch.homeTeam, winner: finalMatch.winner === 'home' }" @click="finalMatch.homeTeam && pickFinalWinner('home')">
                <team-flag v-if="finalMatch.homeTeam" :name="finalMatch.homeTeam" size="medium" />
                <span v-if="finalMatch.homeTeam" class="final-tree-name">{{ finalMatch.homeTeam }}</span>
                <span v-else class="final-placeholder">?</span>
              </div>
              <div class="final-tree-vs">VS</div>
              <div class="final-tree-team" :class="{ 'has-team': finalMatch.awayTeam, winner: finalMatch.winner === 'away' }" @click="finalMatch.awayTeam && pickFinalWinner('away')">
                <team-flag v-if="finalMatch.awayTeam" :name="finalMatch.awayTeam" size="medium" />
                <span v-if="finalMatch.awayTeam" class="final-tree-name">{{ finalMatch.awayTeam }}</span>
                <span v-else class="final-placeholder">?</span>
              </div>
            </div>
            <div v-if="finalMatch.winner && finalMatch.homeTeam && finalMatch.awayTeam" class="champion-tree">
              <div class="champion-crown">👑</div>
              <div class="champion-flag">{{ getFlagEmoji(finalMatch.winner === 'home' ? finalMatch.homeTeam : finalMatch.awayTeam) }}</div>
              <div class="champion-name">{{ finalMatch.winner === 'home' ? finalMatch.homeTeam : finalMatch.awayTeam }}</div>
            </div>
          </div>

          <!-- 下半区 -->
          <div class="half-tree">
            <div class="half-tree-title">下半区</div>
            <div class="half-tree-body">
              <!-- 左侧 -->
              <div class="side-tree left-tree">
                <div class="tree-col r16-col">
                  <div v-for="(match, idx) in lowerLeft.round16" :key="'ll-r16-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="predictMatch('lowerLeft', 'round16', idx, 'home')">
                      <team-flag :name="match.homeTeam" size="small" />
                      <span class="tree-team-name">{{ match.homeTeam }}</span>
                    </div>
                    <div class="tree-team" :class="{ winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="predictMatch('lowerLeft', 'round16', idx, 'away')">
                      <team-flag :name="match.awayTeam" size="small" />
                      <span class="tree-team-name">{{ match.awayTeam }}</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col r8-col">
                  <div v-for="(match, idx) in lowerLeft.round8" :key="'ll-r8-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': match.homeTeam, winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="match.homeTeam && predictMatch('lowerLeft', 'round8', idx, 'home')">
                      <team-flag v-if="match.homeTeam" :name="match.homeTeam" size="small" />
                      <span v-if="match.homeTeam" class="tree-team-name">{{ match.homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': match.awayTeam, winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="match.awayTeam && predictMatch('lowerLeft', 'round8', idx, 'away')">
                      <team-flag v-if="match.awayTeam" :name="match.awayTeam" size="small" />
                      <span v-if="match.awayTeam" class="tree-team-name">{{ match.awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col qf-col">
                  <div class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[2].homeTeam, winner: quarterFinals[2].winner === 'home', eliminated: quarterFinals[2].winner === 'away' }" @click="quarterFinals[2].homeTeam && predictQuarterFinal(2, 'home')">
                      <team-flag v-if="quarterFinals[2].homeTeam" :name="quarterFinals[2].homeTeam" size="small" />
                      <span v-if="quarterFinals[2].homeTeam" class="tree-team-name">{{ quarterFinals[2].homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[2].awayTeam, winner: quarterFinals[2].winner === 'away', eliminated: quarterFinals[2].winner === 'home' }" @click="quarterFinals[2].awayTeam && predictQuarterFinal(2, 'away')">
                      <team-flag v-if="quarterFinals[2].awayTeam" :name="quarterFinals[2].awayTeam" size="small" />
                      <span v-if="quarterFinals[2].awayTeam" class="tree-team-name">{{ quarterFinals[2].awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
              </div>
              <!-- 中间 半决赛 -->
              <div class="semi-center">
                <div class="tree-match semi-match">
                  <div class="tree-team" :class="{ 'has-team': semiFinals[1].homeTeam, winner: semiFinals[1].winner === 'home', eliminated: semiFinals[1].winner === 'away' }" @click="semiFinals[1].homeTeam && predictSemiFinal(1, 'home')">
                    <team-flag v-if="semiFinals[1].homeTeam" :name="semiFinals[1].homeTeam" size="small" />
                    <span v-if="semiFinals[1].homeTeam" class="tree-team-name">{{ semiFinals[1].homeTeam }}</span>
                    <span v-else class="tree-placeholder">?</span>
                  </div>
                  <div class="tree-team" :class="{ 'has-team': semiFinals[1].awayTeam, winner: semiFinals[1].winner === 'away', eliminated: semiFinals[1].winner === 'home' }" @click="semiFinals[1].awayTeam && predictSemiFinal(1, 'away')">
                    <team-flag v-if="semiFinals[1].awayTeam" :name="semiFinals[1].awayTeam" size="small" />
                    <span v-if="semiFinals[1].awayTeam" class="tree-team-name">{{ semiFinals[1].awayTeam }}</span>
                    <span v-else class="tree-placeholder">?</span>
                  </div>
                </div>
              </div>
              <!-- 右侧 -->
              <div class="side-tree right-tree">
                <div class="tree-col qf-col">
                  <div class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[3].homeTeam, winner: quarterFinals[3].winner === 'home', eliminated: quarterFinals[3].winner === 'away' }" @click="quarterFinals[3].homeTeam && predictQuarterFinal(3, 'home')">
                      <team-flag v-if="quarterFinals[3].homeTeam" :name="quarterFinals[3].homeTeam" size="small" />
                      <span v-if="quarterFinals[3].homeTeam" class="tree-team-name">{{ quarterFinals[3].homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': quarterFinals[3].awayTeam, winner: quarterFinals[3].winner === 'away', eliminated: quarterFinals[3].winner === 'home' }" @click="quarterFinals[3].awayTeam && predictQuarterFinal(3, 'away')">
                      <team-flag v-if="quarterFinals[3].awayTeam" :name="quarterFinals[3].awayTeam" size="small" />
                      <span v-if="quarterFinals[3].awayTeam" class="tree-team-name">{{ quarterFinals[3].awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col r8-col">
                  <div v-for="(match, idx) in lowerRight.round8" :key="'lr-r8-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ 'has-team': match.homeTeam, winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="match.homeTeam && predictMatch('lowerRight', 'round8', idx, 'home')">
                      <team-flag v-if="match.homeTeam" :name="match.homeTeam" size="small" />
                      <span v-if="match.homeTeam" class="tree-team-name">{{ match.homeTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                    <div class="tree-team" :class="{ 'has-team': match.awayTeam, winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="match.awayTeam && predictMatch('lowerRight', 'round8', idx, 'away')">
                      <team-flag v-if="match.awayTeam" :name="match.awayTeam" size="small" />
                      <span v-if="match.awayTeam" class="tree-team-name">{{ match.awayTeam }}</span>
                      <span v-else class="tree-placeholder">?</span>
                    </div>
                  </div>
                </div>
                <div class="tree-col r16-col">
                  <div v-for="(match, idx) in lowerRight.round16" :key="'lr-r16-'+idx" class="tree-match">
                    <div class="tree-team" :class="{ winner: match.winner === 'home', eliminated: match.winner === 'away' }" @click="predictMatch('lowerRight', 'round16', idx, 'home')">
                      <team-flag :name="match.homeTeam" size="small" />
                      <span class="tree-team-name">{{ match.homeTeam }}</span>
                    </div>
                    <div class="tree-team" :class="{ winner: match.winner === 'away', eliminated: match.winner === 'home' }" @click="predictMatch('lowerRight', 'round16', idx, 'away')">
                      <team-flag :name="match.awayTeam" size="small" />
                      <span class="tree-team-name">{{ match.awayTeam }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="knockout-actions">
          <el-button type="success" @click="submitPrediction">完成预测</el-button>
        </div>
      </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h, defineComponent, onMounted, shallowRef } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { QuestionFilled } from '@element-plus/icons-vue'
import { worldcupApi } from '@/api/worldcup'

// ==================== 2026世界杯分组（从接口获取） ====================
const WORLD_CUP_GROUPS = ref<Record<string, string[]>>({})
const groupsLoading = ref(false)

const fetchGroups = async () => {
  groupsLoading.value = true
  try {
    const data = await worldcupApi.getGroups()
    WORLD_CUP_GROUPS.value = data || {}
  } catch (error) {
    console.error('获取世界杯分组失败:', error)
    ElMessage.error('获取分组数据失败，请稍后重试')
  } finally {
    groupsLoading.value = false
  }
}

onMounted(() => {
  fetchGroups()
})

// ==================== 球队信息映射（来自竞彩夺冠赔率数据） ====================
interface TeamInfo {
  cnName: string
  enName: string
  pic: string
}

// ==================== 球队信息映射（来自竞彩夺冠赔率数据） ====================
const teamInfoList: TeamInfo[] = [
  { cnName: '西班牙', enName: 'SPA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/23.png' },
  { cnName: '法国', enName: 'FRA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/375.png' },
  { cnName: '英格兰', enName: 'ENG', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/370.png' },
  { cnName: '阿根廷', enName: 'ARG', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/413.png' },
  { cnName: '巴西', enName: 'BRZ', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/417.png' },
  { cnName: '葡萄牙', enName: 'POG', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/1044.png' },
  { cnName: '德国', enName: 'GER', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/377.png' },
  { cnName: '荷兰', enName: 'NET', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/389.png' },
  { cnName: '比利时', enName: 'BEG', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/363.png' },
  { cnName: '挪威', enName: 'NOW', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/391.png' },
  { cnName: '哥伦比亚', enName: 'COM', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/410.png' },
  { cnName: '瑞士', enName: 'SWI', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/403.png' },
  { cnName: '日本', enName: 'JPN', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/438.png' },
  { cnName: '摩洛哥', enName: 'MCO', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/424.png' },
  { cnName: '乌拉圭', enName: 'URU', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/414.png' },
  { cnName: '土耳其', enName: 'TUR', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/404.png' },
  { cnName: '克罗地亚', enName: 'CRO', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/366.png' },
  { cnName: '奥地利', enName: 'AUS', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/360.png' },
  { cnName: '厄瓜多尔', enName: 'ECU', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/415.png' },
  { cnName: '塞内加尔', enName: 'SEN', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/774.png' },
  { cnName: '墨西哥', enName: 'MEX', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/416.png' },
  { cnName: '瑞典', enName: 'SWE', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/402.png' },
  { cnName: '美国', enName: 'USA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/523.png' },
  { cnName: '科特迪瓦', enName: 'CIV', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/691.png' },
  { cnName: '韩国', enName: 'KOR', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/430.png' },
  { cnName: '捷克', enName: 'CZE', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/368.png' },
  { cnName: '巴拉圭', enName: 'PGY', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/418.png' },
  { cnName: '埃及', enName: 'EGY', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/543.png' },
  { cnName: '苏格兰', enName: 'SCO', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/398.png' },
  { cnName: '加拿大', enName: 'CAA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/542.png' },
  { cnName: '伊朗', enName: 'IRA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/440.png' },
  { cnName: '阿尔及利', enName: 'ALG', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/985.png' },
  { cnName: '加纳', enName: 'GHA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/422.png' },
  { cnName: '澳大利亚', enName: 'AUA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/421.png' },
  { cnName: '乌兹别克', enName: 'UZB', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/437.png' },
  { cnName: '突尼斯', enName: 'TUN', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/425.png' },
  { cnName: '波黑', enName: 'BOS', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/364.png' },
  { cnName: '南非', enName: 'RSA', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/673.png' },
  { cnName: '巴拿马', enName: 'PAM', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/524.png' },
  { cnName: '佛得角', enName: 'CVI', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/798.png' },
  { cnName: '约旦', enName: 'JOR', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/431.png' },
  { cnName: '刚果金', enName: 'COD', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/775.png' },
  { cnName: '新西兰', enName: 'NZD', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/799.png' },
  { cnName: '卡塔尔', enName: 'QAT', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/428.png' },
  { cnName: '伊拉克', enName: 'IRQ', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/436.png' },
  { cnName: '沙特', enName: 'SAR', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/434.png' },
  { cnName: '海地', enName: 'HAT', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/915.png' },
  { cnName: '库拉索', enName: 'CUR', pic: '//static.sporttery.cn/res_1_0/jcw/upload/teamlogo/zq/2514.png' },
]

// 构建快速查找Map
const teamPicMap: Record<string, string> = {}
teamInfoList.forEach(t => {
  teamPicMap[t.cnName] = t.pic
})

const getTeamPic = (teamName: string): string => {
  if (teamPicMap[teamName]) return teamPicMap[teamName]
  for (const key of Object.keys(teamPicMap)) {
    if (teamName.includes(key) || key.includes(teamName)) {
      return teamPicMap[key] || ''
    }
  }
  return ''
}

// 国旗emoji映射（作为图片加载失败时的fallback）
const flagEmojiMap: Record<string, string> = {
  '西班牙': '🇪🇸', '法国': '🇫🇷', '英格兰': '🏴󠁧󠁢󠁥󠁮󠁧󠁿', '阿根廷': '🇦🇷',
  '巴西': '🇧🇷', '葡萄牙': '🇵🇹', '德国': '🇩🇪', '荷兰': '🇳🇱',
  '比利时': '🇧🇪', '挪威': '🇳🇴', '哥伦比亚': '🇨🇴', '瑞士': '🇨🇭',
  '日本': '🇯🇵', '摩洛哥': '🇲🇦', '乌拉圭': '🇺🇾', '土耳其': '🇹🇷',
  '克罗地亚': '🇭🇷', '奥地利': '🇦🇹', '厄瓜多尔': '🇪🇨', '塞内加尔': '🇸🇳',
  '墨西哥': '🇲🇽', '瑞典': '🇸🇪', '美国': '🇺🇸', '科特迪瓦': '🇨🇮',
  '韩国': '🇰🇷', '捷克': '🇨🇿', '巴拉圭': '🇵🇾', '埃及': '🇪🇬',
  '苏格兰': '🏴󠁧󠁢󠁳󠁣󠁴󠁿', '加拿大': '🇨🇦', '伊朗': '🇮🇷', '阿尔及利': '🇩🇿',
  '加纳': '🇬🇭', '澳大利亚': '🇦🇺', '乌兹别克': '🇺🇿', '突尼斯': '🇹🇳',
  '波黑': '🇧🇦', '南非': '🇿🇦', '巴拿马': '🇵🇦', '佛得角': '🇨🇻',
  '约旦': '🇯🇴', '刚果金': '🇨🇩', '新西兰': '🇳🇿', '卡塔尔': '🇶🇦',
  '伊拉克': '🇮🇶', '沙特': '🇸🇦', '海地': '🇭🇹', '库拉索': '🇨🇼',
}

const getFlagEmoji = (teamName: string): string => {
  if (flagEmojiMap[teamName]) return flagEmojiMap[teamName]
  for (const key of Object.keys(flagEmojiMap)) {
    if (teamName.includes(key) || key.includes(teamName)) {
      return flagEmojiMap[key] || '🌍'
    }
  }
  return '🌍'
}

// TeamFlag 组件：优先显示球队Logo，加载失败则显示国旗emoji
// 使用函数式组件减少响应式开销
const TeamFlag = defineComponent({
  name: 'TeamFlag',
  props: {
    name: { type: String, required: true },
    size: { type: String as () => 'tiny' | 'small' | 'medium' | 'large', default: 'small' }
  },
  setup(props) {
    const showImg = ref(true)
    const pic = getTeamPic(props.name)
    if (!pic) showImg.value = false

    const onError = () => {
      showImg.value = false
    }

    return () => {
      if (showImg.value && pic) {
        return h('img', {
          src: `https:${pic}`,
          class: `team-logo team-logo-${props.size}`,
          onError,
          loading: 'lazy'
        })
      }
      return h('span', { class: `team-flag team-flag-${props.size}` }, getFlagEmoji(props.name))
    }
  }
})

// ==================== 晋级预测 - 小组赛选择 ====================
const predictionPhase = ref<'group' | 'knockout'>('group')
// 每个组按顺序选择：groupSelections[组名] = [第一名, 第二名]
const groupSelections = ref<Record<string, string[]>>({})
// 第三名选择：Set 存储选中的第三名球队名称
const selectedThirdPlaces = ref<Set<string>>(new Set())

// 从硬编码分组数据中提取
const allGroups = computed(() => {
  return Object.entries(WORLD_CUP_GROUPS.value).map(([name, teams]) => ({
    name,
    teams: teams.map(t => ({ name: t }))
  })).sort((a, b) => a.name.localeCompare(b.name))
})

// 获取某组所有球队（按字母序）
const getGroupStandings = (groupName: string): { name: string; points: number; goalDiff: number; goalsFor: number }[] => {
  const group = allGroups.value.find(g => g.name === groupName)
  if (!group) return []
  return group.teams.map(t => ({ name: t.name, points: 0, goalDiff: 0, goalsFor: 0 }))
}

const selectedTop2Count = computed(() => {
  let count = 0
  Object.values(groupSelections.value).forEach(arr => {
    count += Math.min(arr.length, 2)
  })
  return count
})

const selectedThirdCount = computed(() => selectedThirdPlaces.value.size)

const canEnterKnockout = computed(() => selectedTop2Count.value === 24 && selectedThirdCount.value === 8)

// 检查某支球队是否被选中（在某组中排第几名）
const getTeamSelectionRank = (teamName: string, groupName: string): number => {
  const sel = groupSelections.value[groupName]
  if (!sel) return 0
  const idx = sel.indexOf(teamName)
  return idx === -1 ? 0 : idx + 1 // 返回 1=第一, 2=第二, 3=第三
}

const isTeamSelected = (teamName: string) => {
  for (const arr of Object.values(groupSelections.value)) {
    if (arr.includes(teamName)) return true
  }
  return false
}

const toggleTeamSelection = (teamName: string, groupName: string) => {
  if (!groupSelections.value[groupName]) {
    groupSelections.value[groupName] = []
  }
  const sel = groupSelections.value[groupName]
  const existingIdx = sel.indexOf(teamName)

  if (existingIdx !== -1) {
    // 取消选择：移除该球队，并清除同组之后的选择
    // 如果取消的是第三名（index=2），同时从 selectedThirdPlaces 移除
    if (existingIdx === 2) {
      selectedThirdPlaces.value.delete(teamName)
    }
    sel.splice(existingIdx)
    triggerUpdate()
    return
  }

  // 新增选择：按顺序追加
  if (sel.length >= 3) {
    ElMessage.warning(`${groupName}已选满3个名额`)
    return
  }

  // 如果是选第三名（sel.length === 2，即前2名已选，当前是第3个），需要检查全局限额
  if (sel.length === 2) {
    if (selectedThirdPlaces.value.size >= 8 && !selectedThirdPlaces.value.has(teamName)) {
      ElMessage.warning('第三名最多选8个，已满')
      return
    }
    selectedThirdPlaces.value.add(teamName)
  }

  sel.push(teamName)
  triggerUpdate()
}

// ==================== 第三名选择 ====================

// 第三名候选列表（各组未被选为前2名的球队，取积分排名最高的作为候选）
const thirdPlaceCandidates = computed(() => {
  const candidates: {
    groupName: string
    teamName: string
    points: number
    goalDiff: number
    goalsFor: number
  }[] = []

  allGroups.value.forEach(group => {
    const standings = getGroupStandings(group.name)
    const sel = groupSelections.value[group.name] || []
    // 找积分排名中未被选为前2名的最高排名球队作为第三名候选
    for (const team of standings) {
      if (!sel.slice(0, 2).includes(team.name)) {
        candidates.push({
          groupName: group.name,
          teamName: team.name,
          points: team.points,
          goalDiff: team.goalDiff,
          goalsFor: team.goalsFor
        })
        break // 只取一个（最高排名的非前2球队）
      }
    }
  })

  // 按成绩排序
  candidates.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
    return b.goalsFor - a.goalsFor
  })

  return candidates
})

const autoSelectBestThirds = () => {
  // 先清空之前的第三名选择
  selectedThirdPlaces.value = new Set()
  // 同时从 groupSelections 中移除之前选的第三名
  Object.keys(groupSelections.value).forEach(key => {
    const arr = groupSelections.value[key]
    if (arr && arr.length > 2) {
      groupSelections.value[key] = arr.slice(0, 2)
    }
  })

  // 取成绩最好的8个候选，自动写入 groupSelections 和 selectedThirdPlaces
  const best8 = thirdPlaceCandidates.value.slice(0, 8)
  best8.forEach(c => {
    let arr = groupSelections.value[c.groupName]
    if (!arr) {
      arr = []
      groupSelections.value[c.groupName] = arr
    }
    // 确保前2名已选
    if (arr.length < 2) {
      const standings = getGroupStandings(c.groupName)
      const top2 = standings.slice(0, 2).map(t => t.name)
      arr.length = 0
      arr.push(...top2)
    }
    arr.push(c.teamName)
    selectedThirdPlaces.value.add(c.teamName)
  })

  triggerUpdate()
  ElMessage.success(`已自动选择成绩最好的8个第三名`)
}

// 触发响应式更新
const triggerUpdate = () => {
  groupSelections.value = { ...groupSelections.value }
}

const autoSelectTopTeams = () => {
  groupSelections.value = {}
  selectedThirdPlaces.value = new Set()

  allGroups.value.forEach(group => {
    const standings = getGroupStandings(group.name)
    // 前2名自动晋级
    const top2 = standings.slice(0, 2).map(t => t.name)
    if (top2.length > 0) {
      groupSelections.value[group.name] = top2
    }
  })

  triggerUpdate()
  ElMessage.success(`已自动选择 ${selectedTop2Count.value} 支前2名球队`)
}

const goToKnockout = () => {
  if (!canEnterKnockout.value) {
    ElMessage.warning(`请先选择24支前2名球队和8支第三名球队（当前前2名:${selectedTop2Count.value}/24, 第三名:${selectedThirdCount.value}/8）`)
    return
  }
  initKnockoutBracket()
  triggerBracketUpdate()
  predictionPhase.value = 'knockout'
}

// ==================== 淘汰赛数据结构（使用 shallowRef 减少深度响应式追踪） ====================
interface BracketMatch {
  homeTeam: string
  awayTeam: string
  winner: 'home' | 'away' | null
}

// 用 shallowRef 包装整个淘汰赛状态，只追踪顶层引用变化，大幅减少响应式开销
// 上半区左侧：场次73-76 (4场)
const upperLeft = shallowRef({
  round16: [] as BracketMatch[],
  round8: [] as BracketMatch[],
})
// 上半区右侧：场次79-82 (4场)
const upperRight = shallowRef({
  round16: [] as BracketMatch[],
  round8: [] as BracketMatch[],
})
// 下半区左侧：场次77,78,83,84 (4场)
const lowerLeft = shallowRef({
  round16: [] as BracketMatch[],
  round8: [] as BracketMatch[],
})
// 下半区右侧：场次85-88 (4场)
const lowerRight = shallowRef({
  round16: [] as BracketMatch[],
  round8: [] as BracketMatch[],
})

// 1/4决赛(4场) 和 半决赛(2场) — 独立存储
// QF1: upperLeft round8胜者  vs  upperLeft round8胜者
// QF2: upperRight round8胜者 vs upperRight round8胜者
// QF3: lowerLeft round8胜者  vs  lowerLeft round8胜者
// QF4: lowerRight round8胜者 vs lowerRight round8胜者
const quarterFinals = shallowRef<BracketMatch[]>([
  { homeTeam: '', awayTeam: '', winner: null }, // QF1
  { homeTeam: '', awayTeam: '', winner: null }, // QF2
  { homeTeam: '', awayTeam: '', winner: null }, // QF3
  { homeTeam: '', awayTeam: '', winner: null }, // QF4
])

const semiFinals = shallowRef<BracketMatch[]>([
  { homeTeam: '', awayTeam: '', winner: null }, // Semi1: QF1胜者 vs QF2胜者
  { homeTeam: '', awayTeam: '', winner: null }, // Semi2: QF3胜者 vs QF4胜者
])

const finalMatch = shallowRef({
  homeTeam: '',
  awayTeam: '',
  winner: null as 'home' | 'away' | null
})

// 手动触发淘汰赛视图更新（shallowRef 不会自动追踪深层变化）
const triggerBracketUpdate = () => {
  upperLeft.value = { ...upperLeft.value }
  upperRight.value = { ...upperRight.value }
  lowerLeft.value = { ...lowerLeft.value }
  lowerRight.value = { ...lowerRight.value }
  quarterFinals.value = [...quarterFinals.value]
  semiFinals.value = [...semiFinals.value]
  finalMatch.value = { ...finalMatch.value }
}

// ==================== 2026世界杯官方对阵规则 ====================
// 48队赛制，12组 → 32队晋级淘汰赛（12组前2 + 8个最佳第三名）
// 1/16决赛 16场(73-88) → 1/8决赛 8场 → 1/4决赛 4场 → 半决赛 2场 → 决赛
// 上半区(左边显示): 73,74,75,76,79,80,81,82 (8场)
// 下半区(右边显示): 77,78,83,84,85,86,87,88 (8场)
// 1/8配对: 73v74,75v76,79v80,81v82(上半区) | 77v78,83v84,85v86,87v88(下半区)
// 1/4: QF1(左R8[0]v左R8[1]) QF2(左R8[2]v右R8[0]) QF3(左R8[3]v右R8[1]) QF4(右R8[2]v右R8[3])
// 半决: Semi1(QF1vQF2) Semi2(QF3vQF4) → 决赛

// 按成绩从 selectedThirdPlaces 中筛选指定组的第三名
const getThirdByGroups = (candidateGroups: string[], usedSet: Set<string>): string => {
  const sorted = thirdPlaceCandidates.value
    .filter(c => selectedThirdPlaces.value.has(c.teamName) && candidateGroups.includes(c.groupName))
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff
      return b.goalsFor - a.goalsFor
    })
  for (const c of sorted) {
    if (!usedSet.has(c.teamName)) {
      usedSet.add(c.teamName)
      return c.teamName
    }
  }
  // 候选组中无可用球队，从所有剩余未使用的第三名中随机选
  const remaining = Array.from(selectedThirdPlaces.value).filter(t => !usedSet.has(t))
  if (remaining.length > 0) {
    const pick = remaining[Math.floor(Math.random() * remaining.length)]!
    usedSet.add(pick)
    return pick
  }
  return ''
}

// 根据小组赛选择结果初始化淘汰赛对阵
const initKnockoutBracket = () => {
  // 从 groupSelections 获取各组前两名
  const groupWinners: Record<string, { first: string; second: string }> = {}
  allGroups.value.forEach(group => {
    const sel = groupSelections.value[group.name] || []
    groupWinners[group.name] = {
      first: sel[0] || group.name + '第1',
      second: sel[1] || group.name + '第2'
    }
  })

  // 第三名使用跟踪（每个第三名只能用一次）
  const usedThirds = new Set<string>()

  const G = (group: string, rank: 'first' | 'second') =>
    groupWinners[group]?.[rank] || group + (rank === 'first' ? '第1' : '第2')

  const T = (groups: string[]) => getThirdByGroups(groups, usedThirds)

  // ============ 上半区左侧 1/16决赛 4场 ============
  // 场次73: A2 vs B2
  // 场次74: E1 vs T(C/D/F/G/H)
  // 场次75: F1 vs C2
  // 场次76: C1 vs F2
  upperLeft.value.round16 = [
    { homeTeam: G('A组', 'second'), awayTeam: G('B组', 'second'), winner: null },     // 73
    { homeTeam: G('E组', 'first'),  awayTeam: T(['C组','D组','F组','G组','H组']), winner: null }, // 74
    { homeTeam: G('F组', 'first'),  awayTeam: G('C组', 'second'), winner: null },     // 75
    { homeTeam: G('C组', 'first'),  awayTeam: G('F组', 'second'), winner: null },     // 76
  ]

  // ============ 上半区右侧 1/16决赛 4场 ============
  // 场次79: A1 vs T(C/E/F/H/I)
  // 场次80: D2 vs G2
  // 场次81: B1 vs T(A/D/E/F/G)
  // 场次82: H1 vs J2
  upperRight.value.round16 = [
    { homeTeam: G('A组', 'first'),  awayTeam: T(['C组','E组','F组','H组','I组']), winner: null }, // 79
    { homeTeam: G('D组', 'second'), awayTeam: G('G组', 'second'), winner: null },     // 80
    { homeTeam: G('B组', 'first'),  awayTeam: T(['A组','D组','E组','F组','G组']), winner: null }, // 81
    { homeTeam: G('H组', 'first'),  awayTeam: G('J组', 'second'), winner: null },     // 82
  ]

  // ============ 下半区左侧 1/16决赛 4场 ============
  // 场次77: I1 vs T(C/D/F/G/H)
  // 场次78: E2 vs I2
  // 场次83: G1 vs T(B/E/F/I/J)
  // 场次84: F2 vs T(待定)
  lowerLeft.value.round16 = [
    { homeTeam: G('I组', 'first'),  awayTeam: T(['C组','D组','F组','G组','H组']), winner: null }, // 77
    { homeTeam: G('E组', 'second'), awayTeam: G('I组', 'second'), winner: null },     // 78
    { homeTeam: G('G组', 'first'),  awayTeam: T(['B组','E组','F组','I组','J组']), winner: null }, // 83
    { homeTeam: G('F组', 'second'), awayTeam: T(['A组','B组','C组','D组','E组','G组','H组','I组','J组','K组','L组']), winner: null }, // 84
  ]

  // ============ 下半区右侧 1/16决赛 4场 ============
  // 场次85: K2 vs L2
  // 场次86: J1 vs H2
  // 场次87: D1 vs T(B/E/F/I/J)
  // 场次88: L1 vs T(A/C/D/G/K)
  lowerRight.value.round16 = [
    { homeTeam: G('K组', 'second'), awayTeam: G('L组', 'second'), winner: null },    // 85
    { homeTeam: G('J组', 'first'),  awayTeam: G('H组', 'second'), winner: null },    // 86
    { homeTeam: G('D组', 'first'),  awayTeam: T(['B组','E组','F组','I组','J组']), winner: null }, // 87
    { homeTeam: G('L组', 'first'),  awayTeam: T(['A组','C组','D组','G组','K组']), winner: null }, // 88
  ]

  // 初始化后续轮次（每个子区2场round8）
  upperLeft.value.round8 = Array(2).fill(null).map(() => ({ homeTeam: '', awayTeam: '', winner: null }))
  upperRight.value.round8 = Array(2).fill(null).map(() => ({ homeTeam: '', awayTeam: '', winner: null }))
  lowerLeft.value.round8 = Array(2).fill(null).map(() => ({ homeTeam: '', awayTeam: '', winner: null }))
  lowerRight.value.round8 = Array(2).fill(null).map(() => ({ homeTeam: '', awayTeam: '', winner: null }))

  quarterFinals.value = [
    { homeTeam: '', awayTeam: '', winner: null },
    { homeTeam: '', awayTeam: '', winner: null },
    { homeTeam: '', awayTeam: '', winner: null },
    { homeTeam: '', awayTeam: '', winner: null },
  ]
  semiFinals.value = [
    { homeTeam: '', awayTeam: '', winner: null },
    { homeTeam: '', awayTeam: '', winner: null },
  ]

  finalMatch.value = { homeTeam: '', awayTeam: '', winner: null }
}

// 淘汰赛晋级逻辑
// 四个象限各自独立：round16→round8（同象限内）, round8→QF（同象限内）
// QF→Semi, Semi→Final
type Quadrant = 'upperLeft' | 'upperRight' | 'lowerLeft' | 'lowerRight'

const getAdvanceTarget = (quad: Quadrant, round: 'round16' | 'round8', index: number): { targetRound: 'round8' | 'qf'; targetIndex: number; isHome: boolean } | null => {
  if (round === 'round16') {
    // round16 → round8：同象限内 (0,1→0), (2,3→1)
    return { targetRound: 'round8', targetIndex: Math.floor(index / 2), isHome: index % 2 === 0 }
  }
  if (round === 'round8') {
    // round8 → QF：每个象限2场round8 → 1场QF
    const qfMap: Record<Quadrant, number> = {
      upperLeft: 0, upperRight: 1, lowerLeft: 2, lowerRight: 3
    }
    const qfIndex = qfMap[quad]
    return { targetRound: 'qf', targetIndex: qfIndex, isHome: index === 0 }
  }
  return null
}

// QF → semi
const getQfToSemi = (qfIndex: number): { semiIndex: number; isHome: boolean } | null => {
  if (qfIndex === 0) return { semiIndex: 0, isHome: true }   // QF1→Semi1.home
  if (qfIndex === 1) return { semiIndex: 0, isHome: false }   // QF2→Semi1.away
  if (qfIndex === 2) return { semiIndex: 1, isHome: true }    // QF3→Semi2.home
  if (qfIndex === 3) return { semiIndex: 1, isHome: false }   // QF4→Semi2.away
  return null
}

const predictMatch = (quad: Quadrant, round: 'round16' | 'round8', index: number, winner: 'home' | 'away') => {
  const quadData = quad === 'upperLeft' ? upperLeft.value : quad === 'upperRight' ? upperRight.value : quad === 'lowerLeft' ? lowerLeft.value : lowerRight.value
  const match = quadData[round][index]
  if (!match) return
  
  match.winner = winner
  const winnerTeam = winner === 'home' ? match.homeTeam : match.awayTeam
  if (!winnerTeam) return

  const target = getAdvanceTarget(quad, round, index)
  if (!target) return

  if (target.targetRound === 'round8') {
    // round16 → round8：同象限
    const tMatch = quadData.round8[target.targetIndex]
    if (tMatch) {
      if (target.isHome) tMatch.homeTeam = winnerTeam
      else tMatch.awayTeam = winnerTeam
      tMatch.winner = null
    }
    // 清除更深层
    const qfTarget = getAdvanceTarget(quad, 'round8', target.targetIndex)
    if (qfTarget && qfTarget.targetRound === 'qf') {
      const qfMatch = quarterFinals.value[qfTarget.targetIndex]
      if (qfMatch) qfMatch.winner = null
      const st = getQfToSemi(qfTarget.targetIndex)
      if (st) {
        const sm = semiFinals.value[st.semiIndex]
        if (sm) sm.winner = null
        if (st.semiIndex === 0) { finalMatch.value.homeTeam = ''; finalMatch.value.winner = null }
        else { finalMatch.value.awayTeam = ''; finalMatch.value.winner = null }
      }
    }
  } else if (target.targetRound === 'qf') {
    // round8 → quarterFinals
    const qfMatch = quarterFinals.value[target.targetIndex]
    if (qfMatch) {
      if (target.isHome) qfMatch.homeTeam = winnerTeam
      else qfMatch.awayTeam = winnerTeam
      qfMatch.winner = null
    }
    // 清除更深层
    const st = getQfToSemi(target.targetIndex)
    if (st) {
      const sm = semiFinals.value[st.semiIndex]
      if (sm) sm.winner = null
      if (st.semiIndex === 0) { finalMatch.value.homeTeam = ''; finalMatch.value.winner = null }
      else { finalMatch.value.awayTeam = ''; finalMatch.value.winner = null }
    }
  }
  
  triggerBracketUpdate()
}

// QF 预测
const predictQuarterFinal = (qfIndex: number, winner: 'home' | 'away') => {
  const qfMatch = quarterFinals.value[qfIndex]
  if (!qfMatch) return
  qfMatch.winner = winner
  const winnerTeam = winner === 'home' ? qfMatch.homeTeam : qfMatch.awayTeam
  if (!winnerTeam) return

  const st = getQfToSemi(qfIndex)
  if (st) {
    const semiMatch = semiFinals.value[st.semiIndex]
    if (semiMatch) {
      if (st.isHome) semiMatch.homeTeam = winnerTeam
      else semiMatch.awayTeam = winnerTeam
      semiMatch.winner = null
    }
    // 清除决赛
    if (st.semiIndex === 0) { finalMatch.value.homeTeam = ''; finalMatch.value.winner = null }
    else { finalMatch.value.awayTeam = ''; finalMatch.value.winner = null }
  }
  triggerBracketUpdate()
}

// Semi 预测
const predictSemiFinal = (semiIndex: number, winner: 'home' | 'away') => {
  const semiMatch = semiFinals.value[semiIndex]
  if (!semiMatch) return
  semiMatch.winner = winner
  const winnerTeam = winner === 'home' ? semiMatch.homeTeam : semiMatch.awayTeam
  if (!winnerTeam) return

  if (semiIndex === 0) finalMatch.value.homeTeam = winnerTeam
  else finalMatch.value.awayTeam = winnerTeam
  finalMatch.value.winner = null
  triggerBracketUpdate()
}

const pickFinalWinner = (winner: 'home' | 'away') => {
  finalMatch.value.winner = winner
  triggerBracketUpdate()
}

const resetKnockout = () => {
  initKnockoutBracket()
  triggerBracketUpdate()
  ElMessage.success('已重置淘汰赛预测')
}

const submitPrediction = () => {
  if (!finalMatch.value.winner) {
    ElMessage.warning('请先完成全部预测，选出冠军')
    return
  }
  const champion = finalMatch.value.winner === 'home' ? finalMatch.value.homeTeam : finalMatch.value.awayTeam
  ElMessageBox({
    title: '预测完成！',
    message: h('div', { style: 'text-align: center' }, [
      h('p', { style: 'margin-bottom: 12px; font-size: 15px; color: #e6edf3' }, `您预测的冠军是：${getFlagEmoji(champion)} ${champion}`),
      h('img', { src: '/mini.jpg', style: 'width: 160px; height: 160px; border-radius: 8px; display: block; margin: 0 auto 8px' }),
      h('p', { style: 'font-size: 13px; color: #8b949e' }, '微信扫码体验小程序，查看完整预测结果'),
    ]),
    confirmButtonText: '知道了',
    customClass: 'prediction-dialog',
    center: true,
  })
}


</script>

<style scoped>
.worldcup-page {
  min-height: 100vh;
  background: #0a0a14;
  padding-bottom: 40px;
  position: relative;
  overflow: hidden;
}

/* ==================== 炫酷动态背景（GPU加速，纯CSS无JS开销） ==================== */
.bg-animated {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
  contain: layout style paint;
}

/* 星星背景 */
.bg-stars {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 25% 45%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1.5px 1.5px at 40% 15%, rgba(255,255,255,0.7), transparent),
    radial-gradient(1px 1px at 55% 60%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1px 1px at 70% 30%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1.5px 1.5px at 85% 70%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 15% 80%, rgba(255,255,255,0.5), transparent),
    radial-gradient(1px 1px at 60% 85%, rgba(255,255,255,0.4), transparent),
    radial-gradient(1.5px 1.5px at 90% 10%, rgba(255,255,255,0.6), transparent),
    radial-gradient(1px 1px at 35% 90%, rgba(255,255,255,0.3), transparent);
}

/* 光晕效果 - 减少为2个，降低GPU负载 */
.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.12;
  will-change: transform;
  animation: glowFloat 12s ease-in-out infinite;
}

.bg-glow-1 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, #58a6ff, transparent);
  top: -5%;
  left: -5%;
}

.bg-glow-2 {
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, #ff6b6b, transparent);
  bottom: -5%;
  right: -5%;
  animation-delay: -6s;
}

@keyframes glowFloat {
  0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
  50% { transform: translate3d(20px, -20px, 0) scale(1.05); }
}

/* ==================== 头部 ==================== */
.page-header {
  text-align: center;
  padding: 16px 20px;
  background: linear-gradient(180deg, rgba(26,10,46,0.95) 0%, rgba(13,17,23,0.8) 100%);
  border-bottom: 1px solid rgba(88,166,255,0.15);
  position: relative;
  z-index: 1;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  flex-wrap: wrap;
}

.header-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.brand-logo {
  filter: drop-shadow(0 0 8px rgba(88,166,255,0.4));
}

.brand-title {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  line-height: 1.3;
}

.brand-name {
  font-size: 15px;
  font-weight: 700;
  color: #e6edf3;
}

.brand-subtitle {
  font-size: 11px;
  color: #7d8590;
}

.header-divider {
  width: 1px;
  height: 40px;
  background: linear-gradient(180deg, transparent, rgba(88,166,255,0.3), transparent);
}

.header-tournament {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tournament-icon {
  font-size: 28px;
  filter: drop-shadow(0 0 8px rgba(255,217,61,0.5));
}

.tournament-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: #e6edf3;
  margin: 0;
  background: linear-gradient(90deg, #ffd93d, #ff6b6b, #58a6ff, #6bcb77);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  background-size: 300% 100%;
  animation: titleShine 4s ease infinite;
}

@keyframes titleShine {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

/* 移动端降低动画时长以减少GPU负载 */
@media (max-width: 768px) {
  .page-title {
    animation-duration: 6s;
  }
}

.page-subtitle {
  font-size: 12px;
  color: #7d8590;
  margin: 0;
  letter-spacing: 4px;
}

.header-qrcode {
  display: flex;
  align-items: center;
  gap: 8px;
}

.qrcode-img {
  border-radius: 6px;
  border: 1px solid rgba(88,166,255,0.2);
  box-shadow: 0 0 10px rgba(88,166,255,0.15);
}

.qrcode-label {
  font-size: 12px;
  color: #7d8590;
  white-space: nowrap;
}

/* ==================== 预测阶段Tab ==================== */
.phase-tabs {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 16px;
  position: relative;
  z-index: 1;
}

.phase-tab {
  padding: 10px 32px;
  border-radius: 24px;
  font-size: 14px;
  color: #7d8590;
  background: rgba(33,38,45,0.6);
  border: 1px solid rgba(48,54,61,0.5);
  cursor: pointer;
  transition: all 0.3s;
  backdrop-filter: blur(10px);
  font-weight: 500;
}

.phase-tab:hover:not(.disabled) {
  border-color: #58a6ff;
  box-shadow: 0 0 20px rgba(88,166,255,0.15);
}

.phase-tab.active {
  color: #fff;
  background: linear-gradient(135deg, #58a6ff, #3b82f6);
  border-color: #58a6ff;
  box-shadow: 0 0 25px rgba(88,166,255,0.4), 0 4px 15px rgba(88,166,255,0.2);
  transform: translateY(-1px);
}

.phase-tab.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ==================== 小组赛选择 ==================== */
.group-selection {
  padding: 0 16px 24px;
  position: relative;
  z-index: 1;
}

.selection-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  font-size: 13px;
  color: #8b949e;
  text-align: center;
}

.hint-icon {
  color: #58a6ff;
  cursor: help;
}

.progress-bar {
  padding: 0 16px 16px;
}

.progress-text {
  font-size: 13px;
  color: #58a6ff;
  font-weight: 600;
  margin-bottom: 6px;
  text-align: center;
}

.progress-track {
  height: 6px;
  background: #21262d;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #58a6ff, #6bcb77);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-fill.third {
  background: linear-gradient(90deg, #ffd93d, #ff6b6b);
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 0 4px;
}

.group-card {
  background: rgba(22,27,34,0.7);
  border: 1px solid rgba(33,38,45,0.6);
  border-radius: 12px;
  overflow: hidden;
  backdrop-filter: blur(10px);
  transition: all 0.3s;
}

.group-card:hover {
  border-color: rgba(88,166,255,0.3);
  box-shadow: 0 4px 20px rgba(88,166,255,0.1);
}

.group-card-header {
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 700;
  color: #e6edf3;
  background: linear-gradient(135deg, rgba(31,41,55,0.9), rgba(17,24,39,0.9));
  text-align: center;
  letter-spacing: 2px;
  border-bottom: 1px solid rgba(88,166,255,0.1);
}

.group-teams {
  padding: 4px;
}

.team-select-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
  position: relative;
}

.team-select-row:hover {
  background: rgba(33,38,45,0.8);
}

.team-select-row.selected {
  background: rgba(88, 166, 255, 0.12);
}

.team-select-row.rank-1 {
  border-left: 3px solid #6bcb77;
  box-shadow: inset 4px 0 8px rgba(107,203,119,0.1);
}

.team-select-row.rank-2 {
  border-left: 3px solid #58a6ff;
  box-shadow: inset 4px 0 8px rgba(88,166,255,0.1);
}

.team-select-row.rank-3 {
  border-left: 3px solid #ffd93d;
  box-shadow: inset 4px 0 8px rgba(255,217,61,0.1);
}

.team-select-row .team-flag {
  font-size: 14px;
  line-height: 1;
}

.team-select-row .team-name {
  flex: 1;
  font-size: 13px;
  color: #c9d1d9;
}

.select-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.select-circle {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(72,79,88,0.5);
  border-radius: 50%;
  transition: all 0.2s;
}

.team-select-row:hover .select-circle {
  border-color: #58a6ff;
}

.rank-num {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  background: linear-gradient(135deg, #58a6ff, #3b82f6);
  box-shadow: 0 0 10px rgba(88,166,255,0.4);
}

.rank-2 .rank-num {
  background: linear-gradient(135deg, #a0aec0, #718096);
  box-shadow: 0 0 10px rgba(160,174,192,0.4);
}

.rank-3 .rank-num {
  background: linear-gradient(135deg, #ffd93d, #f59e0b);
  box-shadow: 0 0 10px rgba(255,217,61,0.4);
  color: #1a1a2e;
}

.selection-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  padding: 20px 16px;
  position: sticky;
  bottom: 0;
  background: linear-gradient(transparent, rgba(10,10,20,0.95) 30%);
  z-index: 2;
  backdrop-filter: blur(10px);
}

/* ==================== 第三名选择 ==================== */
.third-place-selection {
  padding: 0 16px 24px;
  position: relative;
  z-index: 1;
}

.third-place-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 8px 4px;
}

.third-place-card {
  background: rgba(22,27,34,0.7);
  border: 2px solid rgba(33,38,45,0.6);
  border-radius: 12px;
  padding: 12px 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  backdrop-filter: blur(10px);
}

.third-place-card:hover {
  border-color: rgba(255,217,61,0.5);
  box-shadow: 0 4px 20px rgba(255,217,61,0.15);
  transform: translateY(-2px);
}

.third-place-card.selected {
  border-color: #ffd93d;
  background: rgba(255,217,61,0.1);
  box-shadow: 0 0 25px rgba(255,217,61,0.25), 0 4px 15px rgba(255,217,61,0.1);
}

.tp-group-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 10px;
  color: #ffd93d;
  background: rgba(255,217,61,0.15);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.tp-team-name {
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
  text-align: center;
}

.tp-stats {
  display: flex;
  gap: 8px;
  font-size: 11px;
  color: #8b949e;
}

.tp-check {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tp-checked {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffd93d, #f59e0b);
  color: #1a1a2e;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 0 12px rgba(255,217,61,0.5);
}

.tp-unchecked {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  border: 2px dashed rgba(72,79,88,0.5);
  color: #484f58;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 300;
  transition: all 0.2s;
}

.third-place-card:hover .tp-unchecked {
  border-color: #ffd93d;
  color: #ffd93d;
}

/* ==================== 淘汰赛 - 树状布局 ==================== */
.knockout-stage {
  padding: 0 4px 24px;
  position: relative;
  z-index: 1;
}

.knockout-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 12px;
  font-size: 12px;
  color: #7d8590;
  text-align: center;
}

/* ==================== 树状淘汰赛对阵图 ==================== */
.bracket-tree {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
  contain: layout style;
}

/* 半区 */
.half-tree {
  background: rgba(22, 27, 34, 0.4);
  border: 1px solid rgba(88, 166, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
}

.half-tree-title {
  text-align: center;
  font-size: 16px;
  font-weight: 800;
  color: #58a6ff;
  padding: 10px 16px;
  background: rgba(88, 166, 255, 0.06);
  border-bottom: 1px solid rgba(88, 166, 255, 0.12);
  letter-spacing: 2px;
}

.half-tree-body {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 16px 8px;
  min-height: 420px;
}

/* 侧边树 */
.side-tree {
  display: flex;
  align-items: center;
  gap: 0;
  flex: 1;
}

.left-tree {
  justify-content: flex-end;
}

.right-tree {
  justify-content: flex-start;
}

/* 树列 */
.tree-col {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 8px;
}

.r16-col {
  width: 130px;
}

.r8-col {
  width: 130px;
}

.qf-col {
  width: 130px;
}

/* 树状对阵卡片 */
.tree-match {
  background: rgba(22, 27, 34, 0.7);
  border: 1px solid rgba(48, 54, 61, 0.6);
  border-radius: 6px;
  overflow: hidden;
}

/* 球队行 */
.tree-team {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background-color 0.15s, opacity 0.2s;
  font-size: 12px;
  min-height: 34px;
  border-bottom: 1px solid rgba(33, 38, 45, 0.4);
}

.tree-team:last-child {
  border-bottom: none;
}

.tree-team:hover {
  background: rgba(33, 38, 45, 0.8);
}

.tree-team.winner {
  background: linear-gradient(135deg, rgba(88, 166, 255, 0.25), rgba(59, 130, 246, 0.15));
  box-shadow: inset 0 0 15px rgba(88, 166, 255, 0.1);
}

.tree-team.eliminated {
  opacity: 0.35;
  filter: grayscale(0.5);
}

.tree-team .team-flag,
.tree-team .team-logo {
  flex-shrink: 0;
}

.tree-team-name {
  flex: 1;
  color: #c9d1d9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 12px;
}

.tree-team.winner .tree-team-name {
  color: #58a6ff;
  font-weight: 600;
}

.tree-placeholder {
  color: #484f58;
  font-weight: 700;
  font-size: 13px;
  width: 100%;
  text-align: center;
}

/* 半决赛居中 */
.semi-center {
  flex: 0 0 140px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.semi-match {
  width: 130px;
}

/* 决赛区块 */
.final-tree-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px;
  background: rgba(255, 217, 61, 0.03);
  border: 1px solid rgba(255, 217, 61, 0.12);
  border-radius: 10px;
  margin: 0 auto;
  max-width: 220px;
  width: 100%;
  box-sizing: border-box;
}

.final-tree-label {
  font-size: 11px;
  font-weight: 700;
  color: #ffd93d;
  letter-spacing: 1px;
}

.final-tree-match {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
}

.final-tree-team {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  padding: 6px 4px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 11px;
  min-height: 44px;
  flex: 1;
  min-width: 0;
  background: rgba(22, 27, 34, 0.8);
  border: 1px solid rgba(255, 217, 61, 0.2);
  border-radius: 6px;
}

.final-tree-team:hover {
  background: rgba(33, 38, 45, 0.8);
}

.final-tree-team.winner {
  background: linear-gradient(135deg, rgba(255, 217, 61, 0.3), rgba(255, 107, 107, 0.15));
  box-shadow: 0 0 12px rgba(255, 217, 61, 0.2);
  border-color: #ffd93d;
}

.final-tree-name {
  font-weight: 600;
  color: #e6edf3;
  font-size: 11px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.final-placeholder {
  font-size: 15px;
  color: #484f58;
  font-weight: 300;
}

.final-tree-vs {
  font-size: 10px;
  font-weight: 800;
  color: #ffd93d;
  text-shadow: 0 0 8px rgba(255, 217, 61, 0.4);
  flex-shrink: 0;
  padding: 0 1px;
}

.champion-tree {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 6px 10px;
  background: linear-gradient(135deg, rgba(255, 217, 61, 0.12), rgba(255, 107, 107, 0.08));
  border-radius: 6px;
  border: 1px solid rgba(255, 217, 61, 0.25);
  animation: championGlow 3s ease-in-out infinite;
  will-change: box-shadow;
  width: 100%;
  box-sizing: border-box;
}

@keyframes championGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(255, 217, 61, 0.12); }
  50% { box-shadow: 0 0 20px rgba(255, 217, 61, 0.2); }
}

.champion-crown {
  font-size: 18px;
  filter: drop-shadow(0 0 6px rgba(255, 217, 61, 0.5));
  animation: crownBounce 2s ease-in-out infinite;
  will-change: transform;
}

@keyframes crownBounce {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -2px, 0); }
}

.champion-flag {
  font-size: 18px;
  margin: 0;
}

.champion-name {
  font-size: 11px;
  font-weight: 700;
  color: #ffd93d;
  text-shadow: 0 0 8px rgba(255, 217, 61, 0.4);
}

/* ==================== 赛程数据 - 按日期 ==================== */
.tab-bar {
  display: flex;
  background: rgba(22,27,34,0.85);
  border-bottom: 1px solid rgba(88,166,255,0.15);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
}

.tab-item {
  flex: 1;
  text-align: center;
  padding: 12px;
  font-size: 14px;
  color: #7d8590;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-item.active {
  color: #58a6ff;
  border-bottom-color: #58a6ff;
  font-weight: 600;
}

.date-view {
  padding: 12px 16px;
  position: relative;
  z-index: 1;
}

.empty-state {
  padding: 60px 0;
}

:deep(.el-empty__description p) {
  color: #484f58;
}

.date-section {
  margin-bottom: 20px;
}

.date-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  background: rgba(22,27,34,0.6);
  border-radius: 8px;
  margin-bottom: 8px;
  border: 1px solid rgba(33,38,45,0.5);
  backdrop-filter: blur(10px);
}

.date-text {
  font-size: 15px;
  font-weight: 600;
  color: #e6edf3;
}

.week-text {
  font-size: 12px;
  color: #7d8590;
}

.match-count {
  margin-left: auto;
  font-size: 12px;
  color: #58a6ff;
  background: rgba(88, 166, 255, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
}

.match-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: rgba(33,38,45,0.4);
  border-radius: 8px;
  overflow: hidden;
}

.match-row {
  display: flex;
  align-items: center;
  padding: 10px 12px;
  background: rgba(13,17,23,0.7);
  gap: 10px;
  backdrop-filter: blur(5px);
}

.match-row.is-live {
  background: rgba(255,107,107,0.1);
  box-shadow: inset 0 0 15px rgba(255,107,107,0.05);
}

.match-row.is-done {
  opacity: 0.7;
}

.match-time-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 50px;
}

.match-time {
  font-size: 14px;
  font-weight: 600;
  color: #e6edf3;
}

.match-group {
  font-size: 11px;
  color: #7d8590;
  margin-top: 2px;
}

.match-teams {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.team {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.home-team {
  justify-content: flex-end;
}

.away-team {
  justify-content: flex-start;
}

.team.winner .team-name {
  font-weight: 700;
  color: #e6edf3;
}

.team-flag {
  font-size: 14px;
  line-height: 1;
}

.team-flag-tiny {
  font-size: 16px;
  line-height: 1;
}

.team-flag-small {
  font-size: 20px;
  line-height: 1;
}

.team-flag-medium {
  font-size: 24px;
  line-height: 1;
}

.team-flag-large {
  font-size: 32px;
  line-height: 1;
}

/* 球队Logo图片 */
.team-logo {
  object-fit: contain;
  display: inline-block;
  vertical-align: middle;
  image-rendering: auto;
}

.team-logo-tiny {
  width: 16px;
  height: 16px;
}

.team-logo-small {
  width: 18px;
  height: 18px;
}

.team-logo-medium {
  width: 28px;
  height: 28px;
}

.team-logo-large {
  width: 36px;
  height: 36px;
}

.team-name {
  font-size: 13px;
  color: #8b949e;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100px;
}

.score-col {
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 60px;
  justify-content: center;
}

.score {
  font-size: 18px;
  font-weight: 700;
  color: #e6edf3;
  min-width: 20px;
  text-align: center;
}

.score-divider {
  color: #484f58;
  font-size: 14px;
}

.vs-badge {
  font-size: 12px;
  font-weight: 600;
  color: #484f58;
  letter-spacing: 2px;
}

.live-badge {
  font-size: 12px;
  font-weight: 600;
  color: #ff6b6b;
  animation: pulse-live 1s ease-in-out infinite;
}

@keyframes pulse-live {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.match-status-col {
  min-width: 52px;
  text-align: center;
}

/* ==================== 赛程数据 - 按分组 ==================== */
.group-view {
  padding: 12px 16px;
  position: relative;
  z-index: 1;
}

.group-section {
  margin-bottom: 24px;
}

.group-header {
  padding: 10px 12px;
  background: rgba(22,27,34,0.6);
  border-radius: 8px 8px 0 0;
  border: 1px solid rgba(33,38,45,0.5);
  border-bottom: none;
  backdrop-filter: blur(10px);
}

.group-name {
  font-size: 16px;
  font-weight: 700;
  color: #58a6ff;
}

.group-table-wrapper {
  overflow-x: auto;
  border: 1px solid rgba(33,38,45,0.5);
  border-top: none;
}

.group-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.group-table th {
  background: rgba(22,27,34,0.8);
  color: #7d8590;
  font-weight: 500;
  padding: 8px 6px;
  text-align: center;
  border-bottom: 1px solid rgba(33,38,45,0.5);
  white-space: nowrap;
}

.group-table td {
  padding: 7px 6px;
  text-align: center;
  color: #8b949e;
  border-bottom: 1px solid rgba(13,17,23,0.5);
  background: rgba(13,17,23,0.6);
}

.team-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  text-align: left !important;
}

.team-cell span:last-child {
  color: #e6edf3;
  font-weight: 500;
}

.points-cell {
  font-weight: 700;
  color: #58a6ff !important;
}

.group-matches {
  padding: 8px 0;
  background: rgba(13,17,23,0.6);
  border: 1px solid rgba(33,38,45,0.5);
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.group-match-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  font-size: 12px;
  color: #8b949e;
  border-bottom: 1px solid rgba(22,27,34,0.5);
}

.group-match-item:last-child {
  border-bottom: none;
}

.match-date-short {
  color: #484f58;
  min-width: 70px;
  font-size: 11px;
}

.team-name-short {
  color: #8b949e;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.score-inline {
  font-weight: 700;
  color: #e6edf3;
  min-width: 30px;
  text-align: center;
}

.vs-inline {
  color: #484f58;
  font-size: 10px;
  min-width: 20px;
  text-align: center;
}

/* ==================== 响应式 - 移动端兼容 ==================== */
@media (max-width: 768px) {
  /* 页面整体 */
  .worldcup-page {
    padding-bottom: 20px;
  }

  /* 头部 - 移动端适配 */
  .page-header {
    padding: 12px 12px;
  }

  .header-content {
    gap: 12px;
    justify-content: center;
  }

  .brand-logo {
    width: 36px;
    height: 36px;
  }

  .brand-name {
    font-size: 13px;
  }

  .brand-subtitle {
    font-size: 10px;
  }

  .header-divider {
    height: 28px;
  }

  .tournament-icon {
    font-size: 22px;
  }

  .page-title {
    font-size: 14px;
  }

  .page-subtitle {
    font-size: 10px;
    letter-spacing: 2px;
  }

  .header-qrcode {
    gap: 4px;
  }

  .qrcode-img {
    width: 36px;
    height: 36px;
  }

  .qrcode-label {
    font-size: 10px;
  }

  /* 预测阶段Tab */
  .phase-tabs {
    padding: 12px;
    gap: 8px;
  }

  .phase-tab {
    padding: 8px 20px;
    font-size: 13px;
  }

  /* 小组赛选择 */
  .group-selection {
    padding: 0 8px 16px;
  }

  .selection-hint {
    font-size: 11px;
    padding: 8px;
    flex-wrap: wrap;
  }

  .progress-bar {
    padding: 0 8px 12px;
  }

  .progress-text {
    font-size: 11px;
  }

  .groups-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 0;
  }

  .group-card {
    border-radius: 10px;
  }

  .group-card-header {
    padding: 8px 10px;
    font-size: 13px;
  }

  .team-select-row {
    padding: 6px 8px;
    gap: 6px;
  }

  .team-select-row .team-name {
    font-size: 12px;
  }

  .team-select-row .team-flag {
    font-size: 16px;
  }

  .select-circle {
    width: 16px;
    height: 16px;
  }

  .rank-num {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }

  .selection-actions {
    padding: 16px 8px;
  }

  .selection-actions .el-button {
    width: 100%;
    max-width: 320px;
  }

  /* 第三名选择 */
  .third-place-selection {
    padding: 0 8px 16px;
  }

  .third-place-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
    padding: 4px 0;
  }

  .third-place-card {
    padding: 10px 6px;
    gap: 4px;
  }

  .tp-team-name {
    font-size: 12px;
  }

  .tp-stats {
    font-size: 10px;
    gap: 4px;
  }

  /* 淘汰赛 - 移动端 */
  .knockout-stage {
    padding: 0 0 12px;
  }

  .knockout-hint {
    font-size: 10px;
    padding: 6px;
  }

  .bracket-tree {
    gap: 10px;
    padding: 4px 2px;
  }

  .half-tree-title {
    font-size: 13px;
    padding: 8px 12px;
  }

  .half-tree-body {
    padding: 8px 2px;
    min-height: 280px;
  }

  .tree-col {
    gap: 3px;
  }

  .r16-col,
  .r8-col,
  .qf-col {
    width: 62px;
  }

  .semi-center {
    flex: 0 0 70px;
  }

  .semi-match {
    width: 62px;
  }

  .tree-team {
    font-size: 9px;
    padding: 3px 4px;
    gap: 2px;
    min-height: 24px;
  }

  .tree-team .team-flag {
    font-size: 10px;
  }

  .tree-team-name {
    font-size: 9px;
  }

  .tree-placeholder {
    font-size: 9px;
  }

  .tree-team .team-logo-small {
    width: 12px;
    height: 12px;
  }

  /* 决赛 - 移动端 */
  .final-tree-block {
    max-width: 200px;
    padding: 6px;
    gap: 3px;
  }

  .final-tree-label {
    font-size: 10px;
  }

  .final-tree-match {
    gap: 3px;
  }

  .final-tree-team {
    font-size: 9px;
    padding: 5px 3px;
    gap: 2px;
    min-height: 38px;
    border-radius: 5px;
  }

  .final-tree-team .team-flag {
    font-size: 11px;
  }

  .final-tree-name {
    font-size: 9px;
  }

  .final-placeholder {
    font-size: 13px;
  }

  .final-tree-vs {
    font-size: 8px;
    padding: 0 1px;
  }

  .champion-tree {
    padding: 5px 8px;
    gap: 1px;
    border-radius: 5px;
  }

  .champion-crown {
    font-size: 15px;
  }

  .champion-flag {
    font-size: 16px;
    margin: 0;
  }

  .champion-name {
    font-size: 10px;
  }

  .knockout-actions {
    padding: 16px 8px;
    gap: 8px;
  }

  .knockout-actions .el-button {
    flex: 1;
    max-width: 140px;
  }

  /* 赛程数据 */
  .tab-item {
    font-size: 12px;
    padding: 10px 8px;
  }

  .date-view,
  .group-view {
    padding: 8px 8px;
  }

  .date-header {
    padding: 8px 10px;
  }

  .date-text {
    font-size: 13px;
  }

  .match-row {
    padding: 8px 10px;
    gap: 6px;
  }

  .match-time {
    font-size: 12px;
  }

  .score {
    font-size: 15px;
  }

  .team-name {
    font-size: 11px;
    max-width: 60px;
  }

  .group-table {
    font-size: 11px;
  }

  .group-table th,
  .group-table td {
    padding: 5px 4px;
  }

  /* 全局按钮触摸优化 */
  .el-button {
    min-height: 40px;
    font-size: 13px;
  }
}

/* 小屏手机 (<= 480px) 进一步优化 */
@media (max-width: 480px) {
  .header-content {
    gap: 8px;
  }

  .header-brand {
    gap: 6px;
  }

  .brand-logo {
    width: 28px;
    height: 28px;
  }

  .brand-name {
    font-size: 11px;
  }

  .brand-subtitle {
    font-size: 9px;
    display: none;
  }

  .header-divider {
    height: 22px;
  }

  .tournament-icon {
    font-size: 18px;
  }

  .page-title {
    font-size: 12px;
  }

  .page-subtitle {
    font-size: 9px;
  }

  .qrcode-img {
    width: 26px;
    height: 26px;
  }

  .qrcode-label {
    display: none;
  }

  .phase-tab {
    padding: 6px 14px;
    font-size: 12px;
    border-radius: 20px;
  }

  .team-select-row .team-name {
    font-size: 11px;
  }

  .team-select-row .team-flag {
    font-size: 14px;
  }

  .third-place-grid {
    grid-template-columns: 1fr 1fr;
    gap: 6px;
  }

  .bracket-tree {
    gap: 6px;
    padding: 2px 1px;
  }

  .half-tree-title {
    font-size: 11px;
    padding: 6px 10px;
  }

  .half-tree-body {
    padding: 4px 1px;
    min-height: 220px;
  }

  .tree-col {
    gap: 2px;
  }

  .r16-col,
  .r8-col,
  .qf-col {
    width: 50px;
  }

  .semi-center {
    flex: 0 0 56px;
  }

  .semi-match {
    width: 50px;
  }

  .tree-team {
    font-size: 7px;
    padding: 2px 3px;
    gap: 1px;
    min-height: 18px;
  }

  .tree-team .team-flag {
    font-size: 9px;
  }

  .tree-team-name {
    font-size: 7px;
    max-width: 30px;
  }

  .tree-placeholder {
    font-size: 7px;
  }

  .tree-team .team-logo-small {
    width: 9px;
    height: 9px;
  }

  .final-tree-block {
    max-width: 170px;
    padding: 5px;
    gap: 2px;
  }

  .final-tree-label {
    font-size: 8px;
  }

  .final-tree-match {
    gap: 2px;
  }

  .final-tree-team {
    font-size: 8px;
    padding: 4px 2px;
    gap: 1px;
    min-height: 32px;
    border-radius: 4px;
  }

  .final-tree-team .team-flag {
    font-size: 10px;
  }

  .final-tree-name {
    font-size: 8px;
  }

  .final-placeholder {
    font-size: 11px;
  }

  .final-tree-vs {
    font-size: 7px;
    padding: 0 1px;
  }

  .champion-tree {
    padding: 3px 5px;
    gap: 0;
    border-radius: 4px;
  }

  .champion-crown {
    font-size: 13px;
  }

  .champion-flag {
    font-size: 14px;
  }

  .champion-name {
    font-size: 9px;
  }
}
</style>

<style>
/* 预测完成弹窗样式 */
.prediction-dialog {
  background: #161b22 !important;
  border: 1px solid rgba(255, 217, 61, 0.2) !important;
  border-radius: 12px !important;
}
.prediction-dialog .el-message-box__title {
  color: #ffd93d !important;
  font-size: 18px !important;
  font-weight: 700 !important;
}
.prediction-dialog .el-message-box__message {
  color: #e6edf3 !important;
}
.prediction-dialog .el-button--primary {
  background: linear-gradient(135deg, #ffd93d, #f0a500) !important;
  border: none !important;
  color: #0a0a14 !important;
  font-weight: 600 !important;
}
</style>
