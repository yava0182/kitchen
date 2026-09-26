/**
 * Clodis Expressions System
 * Аналог comp2 и conv2num из референса (Clodis main_core_v2_part13.js)
 * 
 * Референс:
 * - comp2(f, g) - строка 477-491
 * - conv2num(f, g) - строка 492-562
 * - case 's': - строка 504-509 (обработка s:x, s:y, s:z, s:rx, s:ry, s:rz)
 */
import * as THREE from 'three';

/**
 * Контекстный объект (c_object) для вычисления выражений
 * Аналог c_object из референса, который передается в comp2
 * ⭐ ЭТАП 2: Поддержка THREE.Vector3 (как в референсе)
 */
export interface ExpressionContext {
  parent_size?: THREE.Vector3 | { x: number; y: number; z: number }; // Размеры родителя в мм
  root_size?: THREE.Vector3 | { x: number; y: number; z: number };    // Размеры корневой секции в мм
  computed?: any;                                     // Вычисленные значения
  params?: any;                                       // Параметры
  variables?: any;                                    // Переменные
  materials?: any;                                    // Материалы
  props?: any;                                        // Свойства
  local_parent?: any;                                 // Локальный родитель
}

/**
 * Вычисляет выражение Clodis (аналог conv2num из референса)
 * Референс: main_core_v2_part13.js строка 492-562
 * 
 * Поддерживает:
 * - 's:x', 's:y', 's:z' - размеры родителя (parent_size) в мм
 * - 's:rx', 's:ry', 's:rz' - размеры корневой секции (root_size) в мм
 * - Числа - возвращает как есть
 * - Математические выражения (через calculateExpression)
 */
function conv2num(expr: string | number, context: ExpressionContext = {}): number {
  // Если это число, возвращаем его
  if (typeof expr === 'number') {
    return expr;
  }

  // Если это не строка, пытаемся распарсить
  if (typeof expr !== 'string') {
    return 0;
  }

  const exprTrimmed = expr.trim();

  // Если строка пустая, возвращаем 0
  if (!exprTrimmed) {
    return 0;
  }

  // ⭐ ИСПРАВЛЕНО: Сначала проверяем математические выражения (с операторами), потом простые выражения
  // Это важно, потому что 's:x / 2' должно обрабатываться как математическое выражение, а не как простое 's:x'
  
  // Если это математическое выражение с несколькими операторами (например, "s:x - g:g0.thickness * 2")
  // Парсим и вычисляем с учетом приоритета операций (* и / выполняются раньше + и -)
  // Референс использует calculateExpression для арифметики
  
  // Сначала проверяем сложные выражения с несколькими операторами
  // Паттерн для выражения вида: expr1 operator1 expr2 operator2 expr3
  // Например: "s:x - g:g0.thickness * 2"
  const complexMathPattern = /^([\d.]+|s:[xyz]|g:\w+\.\w+|v:\w+)\s*([+\-])\s*([\d.]+|s:[xyz]|g:\w+\.\w+|v:\w+)\s*([*/])\s*([\d.]+|s:[xyz]|g:\w+\.\w+|v:\w+)$/;
  const complexMatch = exprTrimmed.match(complexMathPattern);
  if (complexMatch) {
    const leftExpr = complexMatch[1].trim();
    const op1 = complexMatch[2]; // + или -
    const middleExpr = complexMatch[3].trim();
    const op2 = complexMatch[4]; // * или /
    const rightExpr = complexMatch[5].trim();
    
    const leftVal = conv2num(leftExpr, context);
    const middleVal = conv2num(middleExpr, context);
    const rightVal = conv2num(rightExpr, context);
    
    // Вычисляем сначала умножение/деление (приоритет операций)
    let middleResult: number;
    switch (op2) {
      case '*': middleResult = middleVal * rightVal; break;
      case '/': middleResult = rightVal !== 0 ? middleVal / rightVal : 0; break;
      default: middleResult = middleVal;
    }
    
    // Затем сложение/вычитание
    switch (op1) {
      case '+': return leftVal + middleResult;
      case '-': return leftVal - middleResult;
      default: return leftVal;
    }
  }
  
  // Если это простое математическое выражение с одним оператором (например, "s:x/2", "s:y+16", "s:x / 2")
  const mathPattern = /^([\d.]+|s:[xyz]|g:\w+\.\w+|v:\w+)\s*([+\-*/])\s*([\d.]+|s:[xyz]|g:\w+\.\w+|v:\w+)$/;
  const mathMatch = exprTrimmed.match(mathPattern);
  if (mathMatch) {
    const leftExpr = mathMatch[1].trim();
    const operator = mathMatch[2];
    const rightExpr = mathMatch[3].trim();
    
    const leftVal = conv2num(leftExpr, context);
    const rightVal = conv2num(rightExpr, context);
    
    // Детальное логирование для отладки
    if (exprTrimmed.includes('s:x') || exprTrimmed.includes('g:g0.thickness')) {
      console.log(`🔍 [conv2num] Вычисление математического выражения '${exprTrimmed}':`, {
        leftExpr,
        operator,
        rightExpr,
        leftVal,
        rightVal,
        result: operator === '/' ? (rightVal !== 0 ? leftVal / rightVal : 0) : 
                operator === '*' ? leftVal * rightVal :
                operator === '+' ? leftVal + rightVal :
                leftVal - rightVal,
        context_parent_size: context.parent_size
      });
    }
    
    switch (operator) {
      case '+': return leftVal + rightVal;
      case '-': return leftVal - rightVal;
      case '*': return leftVal * rightVal;
      case '/': return rightVal !== 0 ? leftVal / rightVal : 0;
      default: return 0;
    }
  }

  // Обработка выражений типа 's.x', 's.y', 's.z' (с точкой) - как в референсе для позиции Z
  // Референс: main_core_v2_part19.js:1147 - 'pos': 's.z' для вертикальных деталей
  // ⚠️ ВАЖНО: 's.z' означает позицию Z = 0 (стыковка с задней стенкой)
  if (exprTrimmed === 's.z' || exprTrimmed === 's.x' || exprTrimmed === 's.y') {
    // Референс использует 's.z' для позиции Z вертикальных деталей - это означает 0
    // (стыковка с задней стенкой, которая находится на Z=0)
    return 0;
  }

  // Обработка выражений типа 's:x', 's:y', 's:z' (с двоеточием) - размеры родителя
  // Референс строка 504-509
  // ⚠️ ВАЖНО: Эта проверка должна быть ПОСЛЕ проверки математических выражений
  if (exprTrimmed.startsWith('s:')) {
    const axis = exprTrimmed.substring(2).trim();
    
    // Проверяем, это root_size (s:rx, s:ry, s:rz) или parent_size (s:x, s:y, s:z)
    const isRootSize = axis.startsWith('r');
    const sizeSource = isRootSize ? context.root_size : context.parent_size;
    const axisKey = isRootSize ? axis.substring(1) : axis; // Убираем 'r' для root_size
    
    // 🔍 КРИТИЧЕСКАЯ ПРОВЕРКА: Логируем для s:z
    if (exprTrimmed === 's:z') {
      console.log(`🔍 [conv2num] Вычисление 's:z' (КРИТИЧЕСКАЯ ПРОВЕРКА):`, {
        'exprTrimmed': exprTrimmed,
        'axis': axis,
        'isRootSize': isRootSize,
        'axisKey': axisKey,
        'sizeSource': sizeSource,
        'sizeSource_type': sizeSource instanceof THREE.Vector3 ? 'THREE.Vector3' : typeof sizeSource,
        'sizeSource_value': sizeSource instanceof THREE.Vector3 ? {
          x: sizeSource.x,
          y: sizeSource.y,
          z: sizeSource.z
        } : sizeSource,
        'context.parent_size': context.parent_size,
        'context.parent_size_type': context.parent_size instanceof THREE.Vector3 ? 'THREE.Vector3' : typeof context.parent_size,
        'context.parent_size_value': context.parent_size instanceof THREE.Vector3 ? {
          x: context.parent_size.x,
          y: context.parent_size.y,
          z: context.parent_size.z
        } : context.parent_size
      });
    }
    
    // ⚠️ ВАЖНО: Проверяем, что axisKey это просто 'x', 'y' или 'z' (без операторов)
    if (sizeSource && (axisKey === 'x' || axisKey === 'y' || axisKey === 'z')) {
      // ⭐ ЭТАП 2: Поддержка THREE.Vector3 (как в референсе)
      // Референс использует THREE.Vector3 для parent_size и root_size
      let value: number;
      if (sizeSource instanceof THREE.Vector3) {
        value = sizeSource[axisKey as 'x' | 'y' | 'z'];
      } else if (typeof sizeSource === 'object' && sizeSource !== null) {
        value = (sizeSource as any)[axisKey];
      } else {
        value = 0;
      }
      
      // 🔍 КРИТИЧЕСКАЯ ПРОВЕРКА: Логируем результат для s:z
      if (exprTrimmed === 's:z') {
        console.log(`🔍 [conv2num] Результат 's:z':`, {
          'value': value,
          'value_мм': value,
          'проверка': typeof value === 'number' && !isNaN(value) ? '✅ OK' : '❌ ОШИБКА'
        });
      }
      
      if (typeof value === 'number' && !isNaN(value)) {
        return value; // Возвращаем в мм (как в референсе)
      }
    }
    
    console.warn(`⚠️ [conv2num] Не удалось получить размер для '${exprTrimmed}' из контекста`);
    return 0;
  }

  // Обработка g:groupKey.property (референс строка 550-556)
  if (exprTrimmed.startsWith('g:')) {
    const parts = exprTrimmed.substring(2).split('.');
    const groupKey = parts[0];
    const property = parts[1];
    
    if (property === 'thickness') {
      // Для thickness получаем из группы материалов
      const group = context.materials?.[groupKey];
      if (group?.thickness !== undefined) {
        return group.thickness; // Возвращаем в мм
      }
      // Fallback: пытаемся получить через getMaterialGroup (если доступен)
      if (typeof window !== 'undefined') {
        const clodisGroup = (window as any).clodis?.libs?.materials_groups?.[groupKey];
        const ppGroup = (window as any).pp?.libs?.materials_groups?.[groupKey];
        const group = clodisGroup || ppGroup;
        if (group?.thickness !== undefined) {
          return group.thickness;
        }
      }
    } else {
      // Для других свойств получаем из context.materials[groupKey][property]
      const group = context.materials?.[groupKey];
      if (group?.[property] !== undefined) {
        return group[property];
      }
    }
    
    console.warn(`⚠️ [conv2num] Не удалось получить свойство '${property}' для группы '${groupKey}'`);
    return 0;
  }

  // Обработка v:variable (референс строка 518-523)
  if (exprTrimmed.startsWith('v:')) {
    const varKey = exprTrimmed.substring(2).trim();
    const variable = context.variables?.[varKey];
    if (variable?.value !== undefined) {
      return variable.value; // Возвращаем значение переменной
    }
    // Fallback: пытаемся получить через getGlobalVar (если доступен)
    if (typeof window !== 'undefined') {
      const clodisVars = (window as any).clodis?.variables?.global_vars;
      const ppVars = (window as any).pp?.variables?.global_vars;
      const globalVars = clodisVars || ppVars;
      if (globalVars) {
        const selectedIndex = (window as any).clodis?.variables?.selected_index ?? (window as any).pp?.variables?.selected_index ?? 0;
        const selectedSet = globalVars[selectedIndex];
        const varObj = selectedSet?.vars_hash?.[varKey];
        if (varObj?.value !== undefined) {
          return varObj.value;
        }
      }
    }
    console.warn(`⚠️ [conv2num] Переменная '${varKey}' не найдена`);
    return 0;
  }

  // Если это просто число в строке, парсим
  const num = parseFloat(exprTrimmed);
  if (!isNaN(num)) {
    return num;
  }

  // Если это более сложное математическое выражение, пытаемся вычислить через eval
  // (только если выражение содержит уже замененные значения, например "400/2")
  try {
    // Проверяем, что выражение содержит только числа и операторы (без букв, кроме уже замененных)
    if (/^[\d.\s+\-*/()]+$/.test(exprTrimmed)) {
      const evaluated = eval(exprTrimmed);
      if (typeof evaluated === 'number' && !isNaN(evaluated)) {
        return evaluated;
      }
    }
  } catch (e) {
    // Игнорируем ошибки eval
  }

  console.warn(`⚠️ [conv2num] Неизвестное выражение: '${exprTrimmed}'`);
  return 0;
}

/**
 * Вычисляет значение выражения (аналог comp2 из референса)
 * Референс: main_core_v2_part13.js строка 477-491
 * 
 * @param expr - Выражение (может быть числом, строкой 's:x', или объектом с value)
 * @param context - Контекстный объект (c_object) с parent_size, root_size и т.д.
 * @returns Вычисленное значение в мм
 */
export function comp2(expr: string | number | any, context: ExpressionContext = {}): number {
  // Если это число, возвращаем его
  if (typeof expr === 'number') {
    return expr;
  }

  // Если это объект с value, берем value
  if (typeof expr === 'object' && expr !== null) {
    if (typeof expr.value === 'number') {
      return expr.value;
    }
    if (typeof expr.value === 'string') {
      expr = expr.value;
    } else {
      return 0;
    }
  }

  // Если это строка, вычисляем через conv2num
  if (typeof expr === 'string') {
    try {
      return conv2num(expr, context);
    } catch (error) {
      console.warn(`⚠️ [comp2] Ошибка вычисления выражения '${expr}':`, error);
      return 0;
    }
  }

  return 0;
}

/**
 * Создает контекстный объект (c_object) для дочерней секции
 * Референс: main_core_v2_part18.js строка 2556-2557
 * 
 * @param parentSection - Родительская секция
 * @param rootSection - Корневая секция
 * @param materialGroupKey - Ключ группы материала (например, 'g0') для доступа к g:g0.thickness
 * @returns Контекстный объект с parent_size, root_size и materials в мм
 */
export function createExpressionContext(
  parentSection: any,
  rootSection?: any,
  materialGroupKey?: string
): ExpressionContext {
  const context: ExpressionContext = {};

  // parent_size - размеры родителя в мм (референс строка 2556)
  if (parentSection?.metadata?.size) {
    const parentSize = parentSection.metadata.size;
    // Проверяем, не в метрах ли размеры (< 1)
    context.parent_size = {
      x: parentSize.x < 1 && parentSize.x > 0 ? parentSize.x * 1000 : parentSize.x,
      y: parentSize.y < 1 && parentSize.y > 0 ? parentSize.y * 1000 : parentSize.y,
      z: parentSize.z < 1 && parentSize.z > 0 ? parentSize.z * 1000 : parentSize.z,
    };
  } else {
    context.parent_size = { x: 0, y: 0, z: 0 };
  }

  // root_size - размеры корневой секции в мм (если указана)
  if (rootSection?.metadata?.size) {
    const rootSize = rootSection.metadata.size;
    context.root_size = {
      x: rootSize.x < 1 && rootSize.x > 0 ? rootSize.x * 1000 : rootSize.x,
      y: rootSize.y < 1 && rootSize.y > 0 ? rootSize.y * 1000 : rootSize.y,
      z: rootSize.z < 1 && rootSize.z > 0 ? rootSize.z * 1000 : rootSize.z,
    };
  } else if (parentSection?.metadata?.size) {
    // Если rootSection не указана, используем parentSection как root
    context.root_size = context.parent_size;
  } else {
    context.root_size = { x: 0, y: 0, z: 0 };
  }

  // materials - группы материалов для доступа к g:groupKey.thickness (референс строка 550-556)
  context.materials = {};
  if (materialGroupKey && typeof window !== 'undefined') {
    const clodisGroups = (window as any).clodis?.libs?.materials_groups;
    const ppGroups = (window as any).pp?.libs?.materials_groups;
    const groups = clodisGroups || ppGroups;
    if (groups) {
      const group = groups[materialGroupKey];
      if (group) {
        context.materials[materialGroupKey] = {
          thickness: group.thickness || 0 // В мм
        };
      }
    }
  }

  // variables - глобальные переменные для доступа к v:varname
  if (typeof window !== 'undefined') {
    const clodisVars = (window as any).clodis?.variables?.global_vars;
    const ppVars = (window as any).pp?.variables?.global_vars;
    const globalVars = clodisVars || ppVars;
    if (globalVars) {
      const selectedIndex = (window as any).clodis?.variables?.selected_index ?? (window as any).pp?.variables?.selected_index ?? 0;
      const selectedSet = globalVars[selectedIndex];
      if (selectedSet?.vars_hash) {
        context.variables = {};
        Object.keys(selectedSet.vars_hash).forEach(key => {
          context.variables![key] = {
            value: selectedSet.vars_hash[key].value || 0
          };
        });
      }
    }
  }

  return context;
}
