import { h, defineComponent, PropType, ref, watchEffect } from 'vue'
import { onFontsReady } from 'vooks'
import { useConfig, useTheme } from '../../_mixins'
import type { ThemeProps } from '../../_mixins'
import { ExtractPublicPropTypes, warnOnce } from '../../_utils'
import { watermarkLight, WatermarkTheme } from '../styles'
import style from './styles/index.cssr'

function getRatio (context: any): number {
  if (!context) {
    return 1
  }
  const backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1
  return (window.devicePixelRatio || 1) / backingStore
}

const watermarkProps = {
  ...(useTheme.props as ThemeProps<WatermarkTheme>),
  debug: Boolean,
  cross: Boolean,
  fullscreen: Boolean,
  width: {
    type: Number,
    default: 32
  },
  height: {
    type: Number,
    default: 32
  },
  zIndex: {
    type: Number,
    default: 10
  },
  xGap: {
    type: Number,
    default: 0
  },
  yGap: {
    type: Number,
    default: 0
  },
  yOffset: {
    type: Number,
    default: 0
  },
  xOffset: {
    type: Number,
    default: 0
  },
  rotate: {
    type: Number,
    default: 0
  },
  image: String,
  imageOpacity: { type: Number, default: 1 },
  imageHeight: Number,
  imageWidth: Number,
  content: String,
  selectable: {
    type: Boolean,
    default: true
  },
  fontSize: {
    type: Number,
    default: 14
  },
  fontFamily: String,
  fontStyle: {
    type: String as PropType<
    'normal' | 'italic' | 'oblique' | `oblique ${number}deg`
    >,
    default: 'normal'
  },
  fontVariant: {
    type: String,
    default: ''
  },
  fontWeight: {
    type: Number,
    default: 400
  },
  fontColor: {
    type: String,
    default: 'rgba(128, 128, 128, .3)'
  },
  fontStretch: {
    type: String,
    default: ''
  },
  lineHeight: {
    type: Number,
    default: 14
  }
} as const

export type WatermarkProps = ExtractPublicPropTypes<typeof watermarkProps>

export default defineComponent({
  name: 'Watermark',
  props: watermarkProps,
  setup (props, { slots }) {
    const { mergedClsPrefixRef } = useConfig(props)
    const themeRef = useTheme(
      'Watermark',
      '-watermark',
      style,
      watermarkLight,
      props
    )
    const base64UrlRef = ref('')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const fontsReadyRef = ref(false)
    onFontsReady(() => (fontsReadyRef.value = true))
    watchEffect(() => {
      void fontsReadyRef.value
      const ratio = getRatio(ctx)
      const {
        xGap,
        yGap,
        width,
        height,
        yOffset,
        xOffset,
        rotate,
        image,
        content,
        fontColor,
        fontStyle,
        fontVariant,
        fontStretch,
        fontWeight,
        fontFamily,
        fontSize,
        lineHeight,
        debug
      } = props
      const canvasWidth = (xGap + width) * ratio
      const canvasHeight = (yGap + height) * ratio
      const canvasOffsetLeft = xOffset * ratio
      const canvasOffsetTop = yOffset * ratio
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      if (ctx) {
        ctx.translate(0, 0)
        const markWidth = width * ratio
        const markHeight = height * ratio
        if (debug) {
          ctx.strokeStyle = 'grey'
          ctx.strokeRect(0, 0, markWidth, markHeight)
        }
        ctx.rotate(rotate * (Math.PI / 180))
        if (image) {
          const img = new Image()
          img.crossOrigin = 'anonymous'
          img.referrerPolicy = 'no-referrer'
          img.src = image
          img.onload = () => {
            ctx.globalAlpha = props.imageOpacity
            const { imageWidth, imageHeight } = props
            ctx.drawImage(
              img,
              canvasOffsetLeft,
              canvasOffsetTop,
              (props.imageWidth ||
                (imageHeight
                  ? (img.width * imageHeight) / img.height
                  : img.width)) * ratio,
              (props.imageHeight ||
                (imageWidth
                  ? (img.height * imageWidth) / img.width
                  : img.height)) * ratio
            )
            base64UrlRef.value = canvas.toDataURL()
          }
        } else if (content) {
          if (debug) {
            ctx.strokeStyle = 'green'
            ctx.strokeRect(0, 0, markWidth, markHeight)
          }
          ctx.font = `${fontStyle} ${fontVariant} ${fontWeight} ${fontStretch} ${
            fontSize * ratio
          }px/${lineHeight * ratio}px ${
            fontFamily || themeRef.value.self.fontFamily
          }`
          ctx.fillStyle = fontColor
          ctx.fillText(
            content,
            canvasOffsetLeft,
            canvasOffsetTop + lineHeight * ratio
          )
          base64UrlRef.value = canvas.toDataURL()
        }
      } else {
        warnOnce('watermark', 'Canvas is not supported in the browser.')
      }
    })
    return () => {
      const watarmarkNode = (
        <div
          class={[
            `${mergedClsPrefixRef.value}-watermark`,
            props.fullscreen &&
              `${mergedClsPrefixRef.value}-watermark--fullscreen`
          ]}
          style={{
            zIndex: props.zIndex,
            backgroundSize: `${props.xGap + props.width}px`,
            backgroundPosition: props.cross
              ? `${props.width / 2}px ${props.height / 2}px, 0 0`
              : '',
            backgroundImage: props.cross
              ? `url(${base64UrlRef.value}), url(${base64UrlRef.value})`
              : `url(${base64UrlRef.value})`
          }}
        />
      )
      if (props.fullscreen) return watarmarkNode
      return (
        <div
          class={[
            `${mergedClsPrefixRef.value}-watermark-container`,
            props.selectable &&
              `${mergedClsPrefixRef.value}-watermark-container--selectable`
          ]}
        >
          {slots.default?.()}
          {watarmarkNode}
        </div>
      )
    }
  }
})
