import type {
  AnswerData,
  AnswerInput,
  AnswerOutput,
  AnswerConfig
} from '@sdk/types'
import { INTENT_OBJECT, SKILL_CONFIG } from '@bridge/constants'
import { WidgetWrapper } from '@sdk/aurora'
import { SUPPORTED_WIDGET_EVENTS } from '@sdk/widget-component'

class Leon {
  private static instance: Leon

  constructor() {
    if (!Leon.instance) {
      Leon.instance = this
    }
  }

  /**
   * Apply data to the answer
   * @param answerKey The answer key
   * @param data The data to apply
   * @example setAnswerData('key', { name: 'Leon' })
   */
  public setAnswerData(
    answerKey: string,
    data: AnswerData = null
  ): AnswerConfig {
    try {
      // In case the answer key is a raw answer
      if (SKILL_CONFIG.answers == null || !SKILL_CONFIG.answers[answerKey]) {
        return answerKey
      }

      const answers = SKILL_CONFIG.answers[answerKey] ?? ''
      let answer: AnswerConfig

      if (Array.isArray(answers)) {
        answer = answers[Math.floor(Math.random() * answers.length)] ?? ''
      } else {
        answer = answers
      }

      if (data != null) {
        for (const key in data) {
          if (typeof answer === 'string') {
            answer = (answer as string).replaceAll(
              `%${key}%`,
              String(data[key])
            )
          } else {
            // In case the answer needs speech and text differentiation

            if (answer.text) {
              answer.text = answer.text.replaceAll(
                `%${key}%`,
                String(data[key])
              )
            }
            if (answer.speech) {
              answer.speech = answer.speech.replaceAll(
                `%${key}%`,
                String(data[key])
              )
            }
          }
        }
      }

      if (SKILL_CONFIG.variables) {
        const { variables } = SKILL_CONFIG

        for (const key in variables) {
          if (typeof answer === 'string') {
            answer = (answer as string).replaceAll(
              `%${key}%`,
              String(variables[key])
            )
          } else {
            // In case the answer needs speech and text differentiation

            if (answer.text) {
              answer.text = answer.text.replaceAll(
                `%${key}%`,
                String(variables[key])
              )
            }
            if (answer.speech) {
              answer.speech = answer.speech.replaceAll(
                `%${key}%`,
                String(variables[key])
              )
            }
          }
        }
      }

      return answer
    } catch (e) {
      console.error('Error while setting answer data:', e)

      throw e
    }
  }

  /**
   * Send an answer to the core
   * @param answerInput The answer input
   * @example answer({ key: 'greet' }) // 'Hello world'
   * @example answer({ key: 'welcome', data: { name: 'Louis' } }) // 'Welcome Louis'
   * @example answer({ key: 'confirm', core: { restart: true } }) // 'Would you like to retry?'
   */
  public async answer(answerInput: AnswerInput): Promise<void> {
    try {
      const answerObject: AnswerOutput = {
        ...INTENT_OBJECT,
        output: {
          codes:
            answerInput.widget && !answerInput.key
              ? 'widget'
              : (answerInput.key as string),
          answer:
            answerInput.key != null
              ? this.setAnswerData(answerInput.key, answerInput.data)
              : '',
          core: answerInput.core
        }
      }

      if (answerInput.widget) {
        answerObject.output.widget = {
          actionName: `${INTENT_OBJECT.domain}:${INTENT_OBJECT.skill}:${INTENT_OBJECT.action}`,
          widget: answerInput.widget.widget,
          id: answerInput.widget.id,
          onFetch: answerInput.widget.onFetch ?? null,
          componentTree: new WidgetWrapper({
            ...answerInput.widget.wrapperProps,
            children: [answerInput.widget.render()]
          }),
          supportedEvents: SUPPORTED_WIDGET_EVENTS
        }
      }

      // "Temporize" for the data buffer output on the core
      await new Promise((r) => setTimeout(r, 100))

      process.stdout.write(JSON.stringify(answerObject))
    } catch (e) {
      console.error('Error while creating answer:', e)
    }
  }
}

export const leon = new Leon()
