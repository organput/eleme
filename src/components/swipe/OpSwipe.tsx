import { defineComponent, ref, reactive, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { createNamespace } from '@/utils/create'
import { clamp } from '@/utils/format'
import { doubleRaf, rAF } from '@/utils/raf'
import { useChildren, type NotNullChild } from '@/use/useChildren'
import { useTouch } from '@/use/useTouch'
import { useEventListener } from '@/use/useEventListener'

const [name, bem] = createNamespace('swipe')

export const SWIPE_KEY = Symbol(name)

export type SwipeState = {
  rect: { width: number; height: number } | null
  width: number
  height: number
  offset: number
  active: number
  swiping: boolean
}

export default defineComponent({
  name,
  props: {
    autoplay: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      default: 500,
    },
    loop: {
      type: Boolean,
      default: true,
    },
    showIndicators: {
      type: Boolean,
      default: true,
    },
    vertical: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { slots }) {
    const root = ref()
    const track = ref()
    const state = reactive<SwipeState>({
      rect: null,
      offset: 0,
      width: 0,
      height: 0,
      active: 0,
      swiping: false,
    })
    const touch = useTouch()
    const { children, linkChildren } = useChildren(SWIPE_KEY)
    const delta = computed(() => props.vertical ? touch.deltaY.value: touch.deltaX.value)
    const count = computed(() => children.length)
    
    const size = computed(() => state[props.vertical ? 'height' : 'width'])
    const trackSize = computed(() => count.value * size.value)
    const trackStyle = computed(() => {
      const mainAxis = props.vertical ? 'height' : 'width'
      const style = {
        transitionDuration: `${state.swiping ? 0 : props.duration}ms`,
        transform: `translate${props.vertical ? 'Y' : 'X'}(${state.offset}px)`,
        [mainAxis]: `${trackSize.value}px`,
      }
      // console.log(state.offset)
      return style
    })
    const minOffset = computed(() => {
      if (state.rect) {
        const base = props.vertical ? state.rect.height : state.rect.width
        return base - trackSize.value
      }
      return 0
    })
    const activeIndicator = computed(() => {
      return (state.active + count.value) % count.value
    })

    const getTargetActive = (pace: number) => {
      const { active } = state
      if (pace) {
        if (props.loop) {
          // console.log(active + pace)
          return clamp(active + pace, -1, count.value)
        }
        return clamp(active + pace, 0, count.value - 1)
      }
      return active
    }

    const getTargetOffset = (targetActive: number, offset = 0) => {
      const currentPosition = targetActive * size.value
      const targetOffset = offset - currentPosition
      console.log(targetOffset)
      return targetOffset
    }

    const move = ({ pace = 0, offset = 0 }) => {
      // console.log(count.value)
      if (count.value <= 1) {
        return
      }
      const targetActive = getTargetActive(pace)
      const targetOffset = getTargetOffset(targetActive, offset)

      if (props.loop) {
        if (children[0] && targetOffset !== minOffset.value) {
          const outRightBound = targetOffset < minOffset.value
          children[0].setOffset(outRightBound ? trackSize.value : 0)
          // console.log(outRightBound)
        }
        if (children[count.value - 1] && targetOffset !== 0) {
          const onLeftBound = targetOffset > 0;
          (children[count.value - 1] as unknown as NotNullChild).setOffset(onLeftBound ? -trackSize.value : 0)
          // console.log(onLeftBound)
        }
      }

      state.active = targetActive
      state.offset = targetOffset
    }

    const correctPosition = () => {
      state.swiping = true
      // console.log(1)
      if (state.active <= -1) {
        move({ pace: count.value })
        // console.log(1)
      } else if (state.active >= count.value) {
        move({ pace: -count.value })
      }
    }

    const next = () => {
      correctPosition()
      rAF(() => {
        state.swiping = false
        move({
          pace: 1,
        })
      })
    }

    let timeout: number
    const stopAutoPlay = () => clearTimeout(timeout)
    const autoplay = () => {
      stopAutoPlay()
      if (props.autoplay > 0 && count.value > 1) {
        timeout = setTimeout(() => {
          next()
          autoplay()
        }, props.autoplay)
      }
    }

    const init = () => {
      if (!root.value) {
        return
      }
      const rect = {
        width: root.value?.offsetWidth,
        height: root.value?.offsetHeight,
      }
      state.rect = rect
      state.width = rect.width
      state.height = rect.height
      autoplay()
    }

    let touchStartTime: number
    const onTouchStart = (event: TouchEvent) => {
      touch.start(event)
      touchStartTime = Date.now()

      stopAutoPlay()
      correctPosition()
    }
    const onTouchMove = (event: TouchEvent) => {
      touch.move(event)

      event.preventDefault()
      move({ offset: delta.value })
    }
    const onTouchEnd = () => {
      const duration = Date.now() - touchStartTime
      const speed = delta.value / duration
      const shouldSwipe = Math.abs(speed) > 0.25 || Math.abs(delta.value) > size.value / 2

      if (shouldSwipe) {
        const offset = props.vertical ? touch.offsetY.value : touch.offsetX.value
        let pace = 0
        if (props.loop) {
          pace = offset > 0 ? (delta.value > 0 ? -1 : 1) : 0
        } else {
          pace = -Math[delta.value > 0 ? 'ceil' : 'floor'](delta.value / size.value)
        }
        move({ pace })
      } else {
        move({ pace: 0 })
      }

      state.swiping = false
      autoplay()
    }

    const renderDot = (_: string, index: number) => {
      const active = index === activeIndicator.value
      return <i class={bem('indicator', { active })}></i>
    }

    const renderIndicator = () => {
      if (props.showIndicators) {
        return <div class={bem('indicators')}>
          {Array(count.value).fill('').map(renderDot)}
        </div>
      }
    }

    linkChildren({
      size,
      props
    })

    onMounted(init)
    onBeforeUnmount(stopAutoPlay)
    watch(() => props.autoplay, autoplay)

    useEventListener('touchmove', onTouchMove, {
      target: track
    })

    return () => (
      <div ref={root} class={bem()}>
        <div ref={track} style={trackStyle.value} class={bem('track')} onTouchstart={onTouchStart} onTouchend={onTouchEnd}>
          {slots.default?.()}
        </div>
        {renderIndicator()}
      </div>
    )
  },
})
