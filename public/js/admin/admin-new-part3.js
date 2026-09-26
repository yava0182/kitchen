            childrenContainer.style.display = 'block';
            parentNode.appendChild(childrenContainer);
          }
          
          childrenContainer.appendChild(nodeElement);
          
          // �������������� ���� ����� (���������� � 3D-������� �� ��������)
          syncTreePaths();
          
          // ���� �������� - ������, ���������� �
          if (parentNode !== rootModule && parentNode.getAttribute('data-node-type') === 'section') {
            const toggle = parentNode.querySelector('.tree-node-toggle');
            if (toggle) {
              toggle.querySelector('span').textContent = '▼';
              childrenContainer.style.display = 'block';
            }
          }
        }
        
        // ������������� ����� ����� � �������� 3D-������ (0, 0,0, 0,0,0 � �.�.)
        function syncTreePaths() {
          const container = document.getElementById('constructor-root-module-children');
          if (!container) return;
          const walk = (parentContainer, basePath) => {
            const nodes = Array.from(parentContainer.children).filter((ch) => ch.classList?.contains('constructor-tree-node'));
            nodes.forEach((node, idx) => {
              const p = basePath ? `${basePath},${idx}` : `0,${idx}`;
              node.dataset.cldPath = p;
              const childContainer = node.querySelector(':scope > .tree-node-children');
              if (childContainer) walk(childContainer, p);
            });
          };
          walk(container, '0');
        }
        
        // ����� ���� ������
        function getNodePath(nodeElement) {
          if (!nodeElement || nodeElement === rootModule) return '0';
          const dsPath = nodeElement.dataset?.cldPath;
          if (dsPath) return dsPath;
          
          const parentNode = nodeElement.parentElement?.closest('.constructor-tree-node') || rootModule;
          const childrenContainer = parentNode === rootModule
            ? document.getElementById('constructor-root-module-children')
            : parentNode.querySelector('.tree-node-children');
          if (!childrenContainer) return null;
          const siblings = Array.from(childrenContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
          const idx = siblings.indexOf(nodeElement);
          if (idx < 0) return null;
          const parentPath = parentNode === rootModule ? '0' : getNodePath(parentNode);
          return parentPath ? `${parentPath},${idx}` : null;
        }
        
        // ������� ���������� ���������� �������� � 3D ��� ������ ��������� � ������
        function update3DVisibility(nodeElement) {
          if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;
          
          // ���� ������ �������� ������ - ���������� ��������� � nodeId: null
          if (!nodeElement || nodeElement === rootModule) {
            __ppPreviewIframe.contentWindow.postMessage({ 
              type: 'cld:selectNode',
              nodeId: null,
              path: '0'
            }, '*');
            return;
          }
          
          // �������� ���� ���� ��� ������ � 3D
          const path = getNodePath(nodeElement);
          const nodeType = nodeElement.getAttribute('data-node-type');
          
          if (path) {
            __ppPreviewIframe.contentWindow.postMessage({ 
              type: 'cld:selectNodeByPath',
              path: path,
              nodeType: nodeType
            }, '*');
          } else {
            console.warn('[CLD][admin] update3DVisibility: path not found for node');
          }
        }
        
        function selectTreeNode(nodeElement) {
          // ��������� ������ � ���������� ���� (���� ��������� / �������), ����� ��� ����� ���������
          // �������� �������� ������ � DOM ����� � �� �������� � nodeData → � JSON ��� layout_role.
          try {
            if (typeof currentSelectedNode !== 'undefined' && currentSelectedNode && currentSelectedNode !== nodeElement) {
              if (typeof saveConstructorNodeData === 'function') saveConstructorNodeData(currentSelectedNode);
            }
          } catch (_) {}

          // ������� ��������� � ������ ���������
          document.querySelectorAll('.constructor-tree-item-selected').forEach(el => {
            el.style.backgroundColor = '';
            el.classList.remove('constructor-tree-item-selected');
          });
          
          // �������� ��������� �������
          // ��� ��������� ������ ���������� ��������� �� id
          let header;
          if (nodeElement === rootModule) {
            header = document.getElementById('constructor-root-module-header');
          } else {
            // ��� ������� ����� - ��������� �� ������
            header = nodeElement.querySelector('.tree-node-header');
          }
          
          if (header) {
            header.style.backgroundColor = '#e8f4fd';
            header.classList.add('constructor-tree-item-selected');
          }
          
          currentSelectedNode = nodeElement;
          // ��������� � ���������� ������, ����� ����������� ��� initConstructorTab �� ������
          window.__cldCurrentSelectedNode = currentSelectedNode;
          window.currentSelectedNode = currentSelectedNode;
          
          // ��������� ������ �������
          updateConstructorPropertiesPanel(nodeElement);
          
          // ��������� 3D-������: ������ ��� wireframe, �������� ������ � ���������� ����, ��������������� axes_helper
          update3DVisibility(nodeElement);
        }
        
        // �������� ������������ � ���� ������
        function attachTreeNodeHandlers(nodeElement) {
          // ������� ��������� ���� (�� ������ tree-node-header)
          const header = nodeElement.querySelector('.tree-node-header');
          if (!header) {
            console.warn('[CLD][handlers] ⚠️ �� ������ ��������� ���� ������', {
              node_element: nodeElement,
              innerHTML: nodeElement.innerHTML.substring(0, 200),
            });
            return;
          }
          
          
          // ���� �� ��������� - ����� ��������
          header.addEventListener('click', function(e) {
            if (e.target.closest('.tree-node-menu-trigger') || e.target.closest('.tree-node-menu-dropdown') || e.target.closest('.tree-node-toggle')) {
              return;
            }
            
            selectTreeNode(nodeElement);
          });
          
          // ���������/������������ (������ ��� ������)
          const toggle = nodeElement.querySelector('.tree-node-toggle');
          if (toggle) {
            const childrenContainer = nodeElement.querySelector('.tree-node-children');
            let isExpanded = false;
            
            toggle.addEventListener('click', function(e) {
              e.stopPropagation();
              isExpanded = !isExpanded;
              
              if (childrenContainer) {
                childrenContainer.style.display = isExpanded ? 'block' : 'none';
                toggle.querySelector('span').textContent = isExpanded ? '▼' : '▶';
              }
            });
          }
          
          // ����������� ���� (���������� ��� �� ������, ��� � ��� ��������� ������)
          const menuTrigger = nodeElement.querySelector('.tree-node-menu-trigger');
          const menuDropdown = nodeElement.querySelector('.tree-node-menu-dropdown');
          if (menuTrigger && menuDropdown) {
            let isMenuOpen = false;
            
            // ������� ��� �������� ����
            function closeNodeMenu() {
              if (isMenuOpen) {
                menuDropdown.style.display = 'none';
                isMenuOpen = false;
              }
            }
            
            // ��������/�������� ���� - ���������� mousedown ��� ��������
            menuTrigger.addEventListener('mousedown', function(e) {
              e.stopPropagation();
              e.preventDefault();
              
              // ��������� ��� ������ �������� ����
              document.querySelectorAll('.constructor-tree-item-menu').forEach(menu => {
                if (menu !== menuDropdown) {
                  menu.style.display = 'none';
                }
              });
              
              if (isMenuOpen) {
                closeNodeMenu();
              } else {
                menuDropdown.style.display = 'block';
                menuDropdown.style.zIndex = '10000';
                menuDropdown.style.position = 'absolute';
                isMenuOpen = true;
              }
            });
            
            // �������� ���� ��� ����� ��� ���
            document.addEventListener('click', function(e) {
              if (!menuTrigger.contains(e.target) && !menuDropdown.contains(e.target)) {
                if (isMenuOpen) {
                  closeNodeMenu();
                }
              }
            });
            
            // ����������� ������ ����
            menuDropdown.addEventListener('click', function(e) {
              const action = e.target.closest('[data-action]')?.getAttribute('data-action');
              if (!action) return;
              
              e.stopPropagation();
              closeNodeMenu();
              
              switch(action) {
                case 'add':
                  // ��������: �������� ����� � ��� ����������� �������
                  // ��������� ��������� ���� ��� ���������� ��������
                  openAddElementModal(nodeElement);
                  break;
                case 'paste':
                  // TODO: ����������� �������
                  alert('���������� "��������" ����� ���������� �����');
                  break;
                case 'delete':
                  if (confirm(`������� "${nodeElement.nodeData?.name || '�������'}"?`)) {
                    nodeElement.remove();
                    syncTreePaths();
                    currentSelectedNode = null;
                    window.__cldCurrentSelectedNode = null;
                    window.currentSelectedNode = null;
                    updateConstructorPropertiesPanel(null);
                    update3DVisibility(null);
                    if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
                  }
                  break;
              }
            });
          }
          
          // ������ ����� (���������)
          const eyeIcon = nodeElement.querySelector('.tree-node-eye');
          if (eyeIcon) {
            eyeIcon.addEventListener('click', function(e) {
              e.stopPropagation();
              // TODO: ������������ ���������
            });
          }
        }
        
        // ============================================
        // �������� �������������
        // ============================================
        
        // ��������: ��������� ������� ������� ��� ��������
        const modalCheck = document.getElementById('constructor-add-element-modal');
        if (!modalCheck) console.warn('[CLD][init] ������� ���������� �� �������');
        
        // ��������: ����������� ����������� � ��� ������������ ����� ��� ��������
        const existingNodes = document.querySelectorAll('.constructor-tree-node');
        existingNodes.forEach((node) => attachTreeNodeHandlers(node));
        
        // ���������/������������ ��������� ������
        const rootToggle = document.getElementById('constructor-root-module-toggle');
        const rootChildren = document.getElementById('constructor-root-module-children');
        
        if (rootToggle && rootChildren) {
          rootToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            isRootExpanded = !isRootExpanded;
            
            if (isRootExpanded) {
              rootChildren.style.display = 'block';
              rootToggle.querySelector('span').textContent = '▼';
            } else {
              rootChildren.style.display = 'none';
              rootToggle.querySelector('span').textContent = '▶';
            }
          });
        }
        
        // ��������: ��� ����� �� �������� ������ ������ ������� ������ ���� ������ (������)
        const rootModuleHeader = document.getElementById('constructor-root-module-header');
        if (rootModuleHeader) {
          rootModuleHeader.addEventListener('click', function(e) {
            // �� ������������ ����� �� toggle, ���� � ������ �����
            if (e.target.closest('#constructor-root-module-toggle') || 
                e.target.closest('#module-menu-trigger') || 
                e.target.closest('#module-menu') ||
                e.target.closest('svg')) {
              return;
            }
            
            // �������� �������� ������ (������ ������� ����� ������)
            selectTreeNode(rootModule);
          });
        }
        
        // ����������� ���� (��� �����) ��� ��������� ������ - ������, ����� �� ������������� ������� �������������
        const menuTrigger = document.getElementById('module-menu-trigger');
        const moduleMenu = document.getElementById('module-menu');
        
        if (menuTrigger && moduleMenu) {
          
          let isMenuOpen = false;
          
          // ������� ��� �������� ����
          function closeMenu() {
            if (isMenuOpen) {
              moduleMenu.style.display = 'none';
              isMenuOpen = false;
            }
          }
          
          // ��������/�������� ���� - ���������� mousedown ��� ��������
          menuTrigger.addEventListener('mousedown', function(e) {
            e.stopPropagation();
            e.preventDefault();
            // ��������� ��� ������ �������� ����
            document.querySelectorAll('.constructor-tree-item-menu').forEach(menu => {
              if (menu !== moduleMenu) {
                menu.style.display = 'none';
              }
            });
            
            if (isMenuOpen) {
              // ���� ������� - ��������� ���
              closeMenu();
            } else {
              // ���� ������� - ��������� ���
              moduleMenu.style.display = 'block';
              moduleMenu.style.zIndex = '10000';
              moduleMenu.style.position = 'absolute';
              isMenuOpen = true;
            }
          });
          
          // �������� ���� ��� ����� ��� ��� - ���������� click � ���������
          document.addEventListener('click', function(e) {
            // �� ���������, ���� ���� ��� �� �������� ��� ����
            if (menuTrigger.contains(e.target) || moduleMenu.contains(e.target)) {
              return;
            }
            
            // ��������� ����, ���� ��� �������
            if (isMenuOpen) {
              closeMenu();
            }
          });
          
          // ��������� ���� �������� ��������� (���� ��� �� ���������) - ��� � ���������
          if (!moduleMenu.hasAttribute('data-initialized')) {
            moduleMenu.innerHTML = `
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap; display:flex; align-items:center; gap:6px;" data-action="add">
                <span style="font-size:14px;">+</span>
                <span>��������</span>
              </div>
              <div style="padding:4px 12px; font-size:13px; color:#333; cursor:pointer; white-space:nowrap;" data-action="paste">��������</div>
              <div style="padding:4px 12px; border-top:1px solid #e5e7eb; margin-top:4px; padding-top:8px; font-size:13px; color:#dc3545; cursor:pointer; white-space:nowrap;" data-action="delete">�������</div>
            `;
            moduleMenu.setAttribute('data-initialized', 'true');
          }
          
          // ����������� ������ ���� (����������� ���� ���)
          if (!moduleMenu.hasAttribute('data-handlers-attached')) {
            moduleMenu.addEventListener('click', function(e) {
              const action = e.target.closest('[data-action]')?.getAttribute('data-action');
              if (!action) return;
              
              e.stopPropagation();
              closeMenu();
              
              switch(action) {
                case 'add':
                  // ��������� ��������� ���� ��� ���������� ��������
                  openAddElementModal(rootModule);
                  break;
                case 'paste':
                  // TODO: ����������� �������
                  alert('���������� "��������" ����� ���������� �����');
                  break;
                case 'delete':
                  if (currentSelectedNode === rootModule) {
                    if (confirm('������� �������� ������? ��� �������� ������ ��������.')) {
                      // ������� �������� ��������
                      const childrenContainer = document.getElementById('constructor-root-module-children');
                      if (childrenContainer) {
                        childrenContainer.innerHTML = '';
                      }
                      currentSelectedNode = null;
                      window.__cldCurrentSelectedNode = null;
                      window.currentSelectedNode = null;
                      updateConstructorPropertiesPanel(null);
                      if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
                    }
                  }
                  break;
              }
            });
            moduleMenu.setAttribute('data-handlers-attached', 'true');
          }
        }
        
        // ������ ����� (���������) - ������� ��������
        const eyeIcon = rootModule?.querySelector('svg');
        if (eyeIcon && eyeIcon.parentElement) {
          eyeIcon.parentElement.addEventListener('click', function(e) {
            e.stopPropagation();
            // TODO: ������������ ���������
          });
        }
        
        // ���������� ������ ������� ��� ������ ��������
        function updateConstructorPropertiesPanel(node) {
          const panel = document.getElementById('constructor-properties-panel');
          const placeholder = document.getElementById('constructor-properties-placeholder');
          
          // ��������: ��� ������ �������� ������ ������ ������� ������ (������)
          const isEmpty = !node || node === rootModule;
          if (isEmpty) {
            try {
              const selEl = document.querySelector('.constructor-tree-item-selected');
              console.log('[CLD][panel-empty]', {
                incomingNodeIsNull: !node,
                incomingIsRoot: node === rootModule,
                selectedNodeId: selEl?.getAttribute?.('data-node-id') || '',
                currentSelectedNodeId: window.currentSelectedNode?.getAttribute?.('data-node-id') || '',
              });
            } catch (_) {}
          }
          
          if (panel) {
            // ����������/�������� ������ ������� � placeholder
            if (isEmpty) {
              // �������� ������ ������� - �������� ��� ���� �������, ���������� ������ placeholder
              const allPropertyFields = panel.querySelectorAll('[id^="catalog-constructor-property-"]');
              allPropertyFields.forEach(field => {
                const fieldContainer = field.closest('div[style*="margin-bottom"]');
                if (fieldContainer) fieldContainer.style.display = 'none';
              });
              
              // �������� ������ (������, ��������� � �.�.)
              const detailSection = document.getElementById('catalog-constructor-detail-specific');
              const materialSection = document.getElementById('catalog-constructor-material-section');
              const sizeSection = document.getElementById('catalog-constructor-size-section');
              if (detailSection) detailSection.style.display = 'none';
              if (materialSection) materialSection.style.display = 'none';
              if (sizeSection) sizeSection.style.display = 'none';
              
              // �������� ��������� "��������"
              const propertiesTitle = panel.querySelector('div[style*="font-size:13px; font-weight:600"]');
              if (propertiesTitle) propertiesTitle.style.display = 'none';
              
              // ���������� placeholder
              if (placeholder) placeholder.style.display = 'block';
              
              return;
            } else {
              // �������� ������� ������ - ���������� ��� ���� �������
              const allPropertyFields = panel.querySelectorAll('[id^="catalog-constructor-property-"]');
              allPropertyFields.forEach(field => {
                const fieldContainer = field.closest('div[style*="margin-bottom"]');
                if (fieldContainer) fieldContainer.style.display = '';
              });
              
              // ���������� ��������� "��������"
              const propertiesTitle = panel.querySelector('div[style*="font-size:13px; font-weight:600"]');
              if (propertiesTitle) propertiesTitle.style.display = 'block';
              
              // �������� placeholder
              if (placeholder) placeholder.style.display = 'none';
            }
          } else {
            if (isEmpty) return;
          }
          
          const typeInput = document.getElementById('catalog-constructor-property-type');
          const nameInput = document.getElementById('catalog-constructor-property-name');
          const idInput = document.getElementById('catalog-constructor-property-id');
          const hideWhenFilled = document.getElementById('catalog-constructor-property-hide-when-filled');
          const active = document.getElementById('catalog-constructor-property-active');
          const article = document.getElementById('catalog-constructor-property-article');
          
          // �������� ������ �������� (���� �� data-���������, ����� �� JSON ���������)
          const nodeType = node.getAttribute('data-node-type') || 'section';
          const nodeName = node.getAttribute('data-node-name') || (node === rootModule ? '(������ ��� ��������)' : '');
          const nodeId = node.getAttribute('data-node-id') || '';
          const nodeData = node.nodeData || {}; // nodeData ����� ������� ������ ������ ��������
          
          // ��������: item_types_names � ��� � ���� "���" ��� value (key), ������������ name.
          // �� ���������: section/detail. �� ��� ������� � Clodis ���������� ��� � "facade",
          // ���� ���� � ������ ��� detail.
          let originalType = nodeData.originalType || (nodeType === 'detail' ? 'detail' : 'section');
          
          // ���� � ���� ���� �������� � ������ (modelId ��� spec.id)
          // ��� ��� ��� �������� ����� "�����" (��� � ����������� �������),
          // ������� ��� ������� � UI, ���� ���� originalType ������� "detail".
          if (nodeType === 'detail') {
            const nameStr = String(nodeData.name || nodeName || '');
            if (nodeData.modelId || nodeData.spec?.id || nameStr.indexOf('�����') !== -1) {
              originalType = 'facade';
              nodeData.originalType = 'facade';
            }
          }
          
          // ��������� ������� ����
          // � ���� "���" ���������� ������������� �������� (������, �����, ������ � �.�.)
          if (typeInput) {
            const displayType = TYPE_NAMES[originalType] || TYPE_NAMES[nodeType === 'detail' ? 'detail' : 'section'] || originalType;
            typeInput.value = displayType;
          }
          if (nameInput) nameInput.value = nodeData.name || nodeName;
          if (idInput) idInput.value = nodeData.id || nodeId;
          if (hideWhenFilled !== null) hideWhenFilled.checked = nodeData.hide_when_filled || false;
          if (active !== null) active.checked = nodeData.active !== false; // �� ��������� true
          if (article) article.value = nodeData.article || '';
          
          // ���������� ��� �������� � ����������/�������� ������
          if (nodeType === 'detail') {
            showDetailSections();
            fillDetailProperties(nodeData);
          } else {
            // ��� section: ������/�������/anchor � ��� � bundle/main (�� �������� size-section).
            showSectionSections();
            fillSectionProperties(nodeData);
          }
        }
        
        // ���������� ����� ��� �������
        function fillDetailProperties(nodeData) {
          // ���������� � �����
          const orientation = document.getElementById('catalog-constructor-property-orientation');
          const shape = document.getElementById('catalog-constructor-property-shape');
          // ⭐ �����������: ��������� spec.orientation > orientation > detailOrientation > 'h'
          // ��������: orientation �������� � spec.orientation
          let orientationValue = nodeData.spec?.orientation || nodeData.orientation;
          if (!orientationValue && nodeData.detailOrientation) {
            // ������� �� 'vertical'/'horizontal' � 'v'/'h'
            orientationValue = nodeData.detailOrientation === 'vertical' ? 'v' :
                             nodeData.detailOrientation === 'horizontal' ? 'h' :
                             nodeData.detailOrientation === 'frontal' ? 'f' :
                             nodeData.detailOrientation;
          }
          if (orientation) orientation.value = orientationValue || 'h';
          if (shape) shape.value = nodeData.shape || 'normal';
          
          // ��������
          const materialGroup = document.getElementById('catalog-constructor-property-material-group');
          const materialKey = document.getElementById('catalog-constructor-property-material-key');
          const materialThickness = document.getElementById('catalog-constructor-property-material-thickness');
          // ��������: material_group ������� �� nodeData ��� ������ 'g0'
          // � ���� ������ ���������� facades_group �� ������ �����, � �� material_group � ����
          if (materialGroup) materialGroup.value = nodeData.material_group || 'g0';
          if (materialKey) materialKey.value = __cldNormalizeMaterialKey(nodeData.material_key) || 'material_2';
          if (materialThickness) {
            const gk = materialGroup?.value || nodeData.material_group || 'g0';
            const lib = window.__cldMaterialsLib;
            const groupDef = Array.isArray(lib?.groups) ? lib.groups.find((g) => g && g.key === gk) : null;
            const ov = window.__cldMaterialsState?.groupOverrides?.[gk] || {};
            const v = Number(ov.thickness ?? groupDef?.thickness ?? 16);
            materialThickness.value = Number.isFinite(v) ? String(v) : '';
          }
          
          // ��������� ����������� ���������� ���������
          if (typeof updateMaterialDisplay === 'function') {
            updateMaterialDisplay();
          }
          
          // ��������
          const rotate = document.getElementById('catalog-constructor-property-rotate');
          const fixed = document.getElementById('catalog-constructor-property-fixed');
          if (rotate !== null) rotate.checked = nodeData.rotate || false;
          if (fixed !== null) fixed.checked = nodeData.fixed || false;
          
          // ������
          const edgeNumbering = document.getElementById('catalog-constructor-property-edge-numbering');
          if (edgeNumbering !== null) {
            edgeNumbering.checked = nodeData.edge_numbering !== false;
            // ��������: ��� �������� ������� ��������� ��������� ������ ������
            const edgesListContainer = document.getElementById('catalog-constructor-edges-list-container');
            if (edgesListContainer) {
              edgesListContainer.style.display = edgeNumbering.checked ? 'block' : 'none';
            }
          }
          
          for (let i = 1; i <= 4; i++) {
            const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${i}`);
            const edgeDetailsDiv = document.getElementById(`catalog-constructor-property-edge-${i}-details`);
            const edgeThickness = document.getElementById(`catalog-constructor-property-edge-${i}-thickness`);
            const edgeType = document.getElementById(`catalog-constructor-property-edge-${i}-type`);
            
            const edgeData = nodeData.edges && nodeData.edges[i] ? nodeData.edges[i] : {};
            if (edgeCheckbox !== null) edgeCheckbox.checked = edgeData.enabled || false;
            if (edgeThickness) edgeThickness.value = edgeData.thickness || '0.2';
            
            // ��������: ������ 1 ������ ���������� ������, ��������� - ������ ���� ��������
            if (edgeDetailsDiv) {
              edgeDetailsDiv.style.display = edgeCheckbox && edgeCheckbox.checked ? 'block' : 'none';
            }
            
            if (edgeType) {
              // ��������: ��������� dropdown � ��������� ����� ������
              const edgeTypeValue = edgeData.type || 'butts';
              edgeType.value = edgeTypeValue;
              
              // ���� ��� �� ������ � dropdown, ��������� ���
              let optionExists = false;
              for (let j = 0; j < edgeType.options.length; j++) {
                if (edgeType.options[j].value === edgeTypeValue) {
                  optionExists = true;
                  break;
                }
              }
              
              if (!optionExists && edgeData.type_name) {
                const newOption = document.createElement('option');
                newOption.value = edgeTypeValue;
                newOption.textContent = edgeData.type_name || edgeTypeValue;
                edgeType.appendChild(newOption);
                edgeType.value = edgeTypeValue;
              }
            }

            // ��������������� ��������� ����� ������ (��� � ����: "3: ������ ...")
            const edgeSelectedId = document.getElementById(`catalog-constructor-property-edge-${i}-selected-id`);
            const edgeSelectedName = document.getElementById(`catalog-constructor-property-edge-${i}-selected-name`);
            const edgeLink = document.getElementById(`catalog-constructor-property-edge-${i}-link`);
            const edgeRemove = document.getElementById(`catalog-constructor-property-edge-${i}-remove`);
            const decorIdInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-id`);
            const decorNameInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-name`);
            const decorId = edgeData.decor_id || edgeData.edge_id || '';
            const decorName = edgeData.decor_name || edgeData.edge_name || '';
            if (decorIdInput) decorIdInput.value = decorId ? String(decorId) : '';
            if (decorNameInput) decorNameInput.value = decorName || '';
            if (edgeSelectedId) {
              edgeSelectedId.textContent = decorId ? String(decorId) + ':' : '';
              edgeSelectedId.style.display = decorId ? 'inline' : 'none';
            }
            if (edgeSelectedName) {
              edgeSelectedName.textContent = decorName || '';
              edgeSelectedName.style.display = decorName ? 'inline' : 'none';
            }
            if (edgeLink) {
              if (decorId) {
                edgeLink.style.display = 'inline-block';
                edgeLink.href = `#edge-item-edit?type=butt_butts&id=${encodeURIComponent(decorId)}&name=${encodeURIComponent('������')}`;
              } else {
                edgeLink.style.display = 'none';
              }
            }
            if (edgeRemove) {
              edgeRemove.style.display = decorId ? 'inline-block' : 'none';
            }
          }
          
          // �������
          const sizeX = document.getElementById('catalog-constructor-property-size-x');
          const sizeY = document.getElementById('catalog-constructor-property-size-y');
          const sizeZ = document.getElementById('catalog-constructor-property-size-z');
          
          // ��� �������: ���� ���� ������, ����������� ������� �� getDetailDefaults
          // �����: ��� ������ ����� ��������� ��� � nodeData, ��� � � data-detail-type �� DOM-����.
          const detailTypeId =
            nodeData.detailType ||
            nodeData.detailTypeId ||
            nodeData.spec?.detailTypeId ||
            currentSelectedNode?.getAttribute('data-detail-type') ||
            '';
          let defaultSize = {}, defaultPos = {}, defaultPivot = null;
          if (detailTypeId) {
            const dflt = cldGetDetailDefaults(detailTypeId);
            if (dflt) {
              defaultSize = dflt.size || {};
              defaultPos = dflt.pos || {};
              defaultPivot = dflt.pivot || null;
            }
          }
          
          if (sizeX) sizeX.value = nodeData.size?.x || defaultSize.x || '';
          if (sizeY) sizeY.value = nodeData.size?.y || defaultSize.y || '';
          if (sizeZ) sizeZ.value = nodeData.size?.z || defaultSize.z || '';

          // �������� ������ ������������: ������ ������ ������� �� X �� ������� ���������.
          // ������ (��� � ���������) ����������� ���� �� ���� ������ ������.
          if (detailTypeId && (detailTypeId === 'horizontal_bottom' || detailTypeId === 'horizontal_middle' || detailTypeId === 'horizontal_top')) {
            const oldSizeX = String(nodeData.size?.x ?? '').trim();
            const oldPosX = String(nodeData.position?.x ?? '').trim();
            const looksLikeOldInset =
              oldSizeX === '@section.width - $wall.thickness * 2' &&
              oldPosX === '$wall.thickness' &&
              !nodeData.anchor_user_set;
            if (looksLikeOldInset && currentSelectedNode && currentSelectedNode.nodeData) {
              currentSelectedNode.nodeData.size = currentSelectedNode.nodeData.size || {};
              currentSelectedNode.nodeData.position = currentSelectedNode.nodeData.position || {};
              currentSelectedNode.nodeData.size.x = '@section.width';
              currentSelectedNode.nodeData.position.x = 0;
              // pivot.x ������� -1 (��� � ����), ������ ��������� ���� ����� �������
              currentSelectedNode.nodeData.anchor = currentSelectedNode.nodeData.anchor || { x: -1, y: -1, z: -1 };
              if (currentSelectedNode.nodeData.anchor.x === undefined) currentSelectedNode.nodeData.anchor.x = -1;

              // ������� UI ���� �����
              if (sizeX) sizeX.value = '@section.width';
              const posX = document.getElementById('catalog-constructor-property-pos-x');
              if (posX) posX.value = 0;

              // � �������� � ������
              saveConstructorNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }
          }
          
          // ����������������
          const posX = document.getElementById('catalog-constructor-property-pos-x');
          const posY = document.getElementById('catalog-constructor-property-pos-y');
          const posZ = document.getElementById('catalog-constructor-property-pos-z');
          if (posX) posX.value = nodeData.position?.x !== undefined ? nodeData.position.x : (defaultPos.x !== undefined ? defaultPos.x : '0');
          if (posY) posY.value = nodeData.position?.y !== undefined ? nodeData.position.y : (defaultPos.y !== undefined ? defaultPos.y : '0');
          if (posZ) posZ.value = nodeData.position?.z !== undefined ? nodeData.position.z : (defaultPos.z !== undefined ? defaultPos.z : '0');
          
          // ����� �������
          // �����: ���������� ?? ������ ||, ����� �������� 0 (�����) �� ���������� ��������.
          // ���� anchor ����������� � ���� ������ �� getDetailDefaults(detailTypeId).pivot (��� � ���������).
          const isZeroAnchor =
            nodeData.anchor &&
            Number(nodeData.anchor.x) === 0 &&
            Number(nodeData.anchor.y) === 0 &&
            Number(nodeData.anchor.z) === 0;
          const shouldUseDefaultPivot = !nodeData.anchor || (!nodeData.anchor_user_set && isZeroAnchor);
          const effPivot = shouldUseDefaultPivot && defaultPivot ? defaultPivot : nodeData.anchor;
          updateAnchorButtons('x', effPivot?.x ?? defaultPivot?.x ?? 0);
          updateAnchorButtons('y', effPivot?.y ?? defaultPivot?.y ?? 0);
          updateAnchorButtons('z', effPivot?.z ?? defaultPivot?.z ?? 0);
          
          // �������
          const rotX = document.getElementById('catalog-constructor-property-rot-x');
          const rotY = document.getElementById('catalog-constructor-property-rot-y');
          const rotZ = document.getElementById('catalog-constructor-property-rot-z');
          if (rotX) rotX.value = nodeData.rotation?.x || '0';
          if (rotY) rotY.value = nodeData.rotation?.y || '0';
          if (rotZ) rotZ.value = nodeData.rotation?.z || '0';
          
          // �������, �����������, �������
          const comments = document.getElementById('catalog-constructor-property-comments');
          if (comments) comments.value = nodeData.comments || '';
          
          const eventBeforeParams = document.getElementById('catalog-constructor-property-event-before-params');
          const eventBeforeBuild = document.getElementById('catalog-constructor-property-event-before-build');
          const eventAfterBuild = document.getElementById('catalog-constructor-property-event-after-build');
          const eventDragEnd = document.getElementById('catalog-constructor-property-event-drag-end');
          if (eventBeforeParams) eventBeforeParams.value = nodeData.events?.on_before_params || '';
          if (eventBeforeBuild) eventBeforeBuild.value = nodeData.events?.on_before_build || '';
          if (eventAfterBuild) eventAfterBuild.value = nodeData.events?.on_after_build || '';
          if (eventDragEnd) eventDragEnd.value = nodeData.events?.on_drag_end || '';
          
          // ���� ��� ����������
          const fillKey = document.getElementById('catalog-constructor-property-fill-key');
          if (fillKey) fillKey.value = nodeData.fill_key || '';
          
          // ����� ��������
          const considerSize = document.getElementById('catalog-constructor-property-consider-size');
          const considerCuts = document.getElementById('catalog-constructor-property-consider-cuts');
          const considerIntersections = document.getElementById('catalog-constructor-property-consider-intersections');
          const showNested = document.getElementById('catalog-constructor-property-show-nested');
          if (considerSize !== null) considerSize.checked = nodeData.consider_size || false;
          if (considerCuts !== null) considerCuts.checked = nodeData.consider_cuts || false;
          if (considerIntersections !== null) considerIntersections.checked = nodeData.consider_intersections || false;
          if (showNested !== null) showNested.checked = nodeData.show_nested || false;
          
          // ��������� ������ �������������
          if (typeof updateAccessoriesList === 'function') {
            updateAccessoriesList();
          }
          
          // ��������� ����������� ���������
          if (typeof updateMaterialDisplay === 'function') {
            updateMaterialDisplay();
          }
        }
        
        // ���������� ������ ����� ������� (anchor)
        function updateAnchorButtons(axis, value) {
          const target = Number(value);
          const valueNum = Number.isFinite(target) ? target : 0;
          const buttons = document.querySelectorAll(`.anchor-btn[data-axis="${axis}"]`);
          buttons.forEach(btn => {
            const btnValue = parseInt(btn.getAttribute('data-value'));
            if (btnValue === valueNum) {
              btn.style.background = '#C5FF5D';
              btn.style.color = '#333';
              btn.style.border = 'none';
              btn.setAttribute('data-active', 'true');
            } else {
              btn.style.background = '#f5f5f5';
              btn.style.color = '#333';
              btn.style.border = '1px solid #d0d7e2';
              btn.removeAttribute('data-active');
            }
          });
        }
        
        // ������� ������ ��� �������
        function hideDetailSections() {
          const detailSpecific = document.getElementById('catalog-constructor-detail-specific');
          const materialSection = document.getElementById('catalog-constructor-material-section');
          const detailCheckboxes = document.getElementById('catalog-constructor-detail-checkboxes');
          const edgesSection = document.getElementById('catalog-constructor-edges-section');
          const sizeSection = document.getElementById('catalog-constructor-size-section');
          const positionSection = document.getElementById('catalog-constructor-position-section');
          const advancedSection = document.getElementById('catalog-constructor-advanced-section');
          
          [detailSpecific, materialSection, detailCheckboxes, edgesSection, sizeSection, positionSection, advancedSection].forEach(section => {
            if (section) section.style.display = 'none';
          });
        }
        
        // ����� ������ ��� ������� (����� ���������� ��� ������ ������)
        function showDetailSections() {
          const detailSpecific = document.getElementById('catalog-constructor-detail-specific');
          const materialSection = document.getElementById('catalog-constructor-material-section');
          const detailCheckboxes = document.getElementById('catalog-constructor-detail-checkboxes');
          const edgesSection = document.getElementById('catalog-constructor-edges-section');
          const sizeSection = document.getElementById('catalog-constructor-size-section');
          const positionSection = document.getElementById('catalog-constructor-position-section');
          const advancedSection = document.getElementById('catalog-constructor-advanced-section');
          
          [detailSpecific, materialSection, detailCheckboxes, edgesSection, sizeSection, positionSection, advancedSection].forEach(section => {
            if (section) section.style.display = 'block';
          });
          if (typeof window.__cldEnsureFormulaButtons === 'function') window.__cldEnsureFormulaButtons();
        }

        // ����� ����� ��� ��������� (section): ��� ����������/������, � �������� � ��������.
        function showSectionSections() {
          const detailSpecific = document.getElementById('catalog-constructor-detail-specific');
          const materialSection = document.getElementById('catalog-constructor-material-section');
          const detailCheckboxes = document.getElementById('catalog-constructor-detail-checkboxes');
          const edgesSection = document.getElementById('catalog-constructor-edges-section');
          const sizeSection = document.getElementById('catalog-constructor-size-section');
          const positionSection = document.getElementById('catalog-constructor-position-section');
          const advancedSection = document.getElementById('catalog-constructor-advanced-section');

          [detailSpecific, materialSection, detailCheckboxes, edgesSection].forEach(section => {
            if (section) section.style.display = 'none';
          });
          [sizeSection, positionSection, advancedSection].forEach(section => {
            if (section) section.style.display = 'block';
          });
          if (typeof window.__cldEnsureFormulaButtons === 'function') window.__cldEnsureFormulaButtons();
        }
        
        // ���������� ��������� � ��������� �������
        function saveConstructorNodeData(node) {
          if (!node) return;
          
          const typeInput = document.getElementById('catalog-constructor-property-type');
          const nameInput = document.getElementById('catalog-constructor-property-name');
          const idInput = document.getElementById('catalog-constructor-property-id');
          
          if (!node.nodeData) {
            node.nodeData = {};
          }
          
          // ��������� ������� ����: � ���� "���" ������������ ���������, ��� ���������� � ���� (model, facade � �.�.)
          const typeKey = TYPE_NAMES_REVERSE[typeInput?.value] || typeInput?.value || node.nodeData.originalType || 'section';
          node.nodeData.type = typeKey;
          node.nodeData.originalType = typeKey;
          node.nodeData.name = nameInput?.value || '';
          node.nodeData.id = idInput?.value || '';
          node.nodeData.hide_when_filled = document.getElementById('catalog-constructor-property-hide-when-filled')?.checked || false;
          node.nodeData.active = document.getElementById('catalog-constructor-property-active')?.checked !== false;
          node.nodeData.article = document.getElementById('catalog-constructor-property-article')?.value || '';
          
          // ���� ��� ������ - ��������� ��� ���� ������
          // ��� � updateConstructorPropertiesPanel: ��� data-node-type ��������� ������� �������;
          // ����� ���� ��������� � UI ��������, � saveSectionNodeData �� ����������.
          let nodeType = node.getAttribute('data-node-type');
          if (!nodeType) {
            const ot = String(node.nodeData?.originalType || node.nodeData?.type || '').toLowerCase();
            nodeType =
              ot === 'detail' || ot === 'facade' || ot === 'module' || ot === 'model' || ot === 'furniture'
                ? 'detail'
                : 'section';
          }
          if (nodeType === 'detail') {
            saveDetailNodeData(currentSelectedNode);
          } else if (nodeType === 'section') {
            saveSectionNodeData(currentSelectedNode);
          }

          try {
            const rmEl = document.getElementById('constructor-root-module');
            const chEl = document.getElementById('constructor-root-module-children');
            if (rmEl && chEl && typeof window.__ppBuildClodisTemplateTreeFromDom === 'function') {
              rmEl.nodeData = rmEl.nodeData || {};
              rmEl.nodeData.clodisJSON = window.__ppBuildClodisTemplateTreeFromDom(chEl);
            }
          } catch (_) {}
          
          // ��������� ���������� ����������� � ������ (��������, ��������)
          if (node === rootModule) {
            const rootName = document.getElementById('constructor-root-module-name');
            if (rootName) {
              rootName.textContent = node.nodeData.name || '(������ ��� ��������)';
            }
          } else {
            // TODO: ���������� �������� ��� �������� ���������
          }
        }
        
        // ���������� ������ ������
        function saveDetailNodeData(node) {
          if (!node.nodeData) return;
          
          const orientation = document.getElementById('catalog-constructor-property-orientation');
          const shape = document.getElementById('catalog-constructor-property-shape');
          // ⭐ �����������: ��������� orientation � spec.orientation (��� � ���������)
          const orientationValue = orientation?.value || 'h';
          node.nodeData.orientation = orientationValue;
          // ��������: orientation �������� � spec.orientation
          if (!node.nodeData.spec) node.nodeData.spec = {};
          node.nodeData.spec.orientation = orientationValue;
          node.nodeData.shape = shape?.value || 'normal';
          
          // ��������
          // ��������: material_group ������� �� UI ��� ������ 'g0'
          // � ���� ������ ���������� facades_group �� ������ �����, � �� material_group � ����
          node.nodeData.material_group = document.getElementById('catalog-constructor-property-material-group')?.value || 'g0';
          node.nodeData.material_key = document.getElementById('catalog-constructor-property-material-key')?.value || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
          // material_id � material_name ����������� ��� ������ ��������� ����� selectMaterialForNode
          
          // ��������
          node.nodeData.rotate = document.getElementById('catalog-constructor-property-rotate')?.checked || false;
          node.nodeData.fixed = document.getElementById('catalog-constructor-property-fixed')?.checked || false;
          
          // ������
          node.nodeData.edge_numbering = document.getElementById('catalog-constructor-property-edge-numbering')?.checked !== false;
          const prevEdges = node.nodeData.edges && typeof node.nodeData.edges === 'object' ? node.nodeData.edges : {};
          node.nodeData.edges = {};
          for (let i = 1; i <= 4; i++) {
            const edgeCheckbox = document.getElementById(`catalog-constructor-property-edge-${i}`);
            const edgeThickness = document.getElementById(`catalog-constructor-property-edge-${i}-thickness`);
            const edgeType = document.getElementById(`catalog-constructor-property-edge-${i}-type`);
            const decorIdInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-id`);
            const decorNameInput = document.getElementById(`catalog-constructor-property-edge-${i}-decor-name`);
            const prev = prevEdges[i] || {};
            const decorIdVal = decorIdInput?.value || '';
            const decorNameVal = decorNameInput?.value || '';
            const thicknessVal = edgeThickness?.value || '';
            node.nodeData.edges[i] = {
              enabled: edgeCheckbox?.checked || false,
              // �������: ���� ������������ ������ �� ��� � ��������� ���������� (���� ����� �� ������),
              // � 0.2 ���������� ������ ��� ������� fallback.
              thickness: thicknessVal || prev.thickness || '0.2',
              type: edgeType?.value || (prev.type || 'butts'),
              type_name: prev.type_name || '',
              decor_id: decorIdVal ? decorIdVal : (prev.decor_id || prev.edge_id || ''),
              decor_name: decorNameVal || prev.decor_name || prev.edge_name || '',
              edge_id: decorIdVal ? decorIdVal : (prev.edge_id || ''),
              edge_name: decorNameVal || prev.edge_name || '',
              color: prev.color || '',
              icon: prev.icon || ''
            };
          }
          
          // �������
          node.nodeData.size = {
            x: document.getElementById('catalog-constructor-property-size-x')?.value || '',
            y: document.getElementById('catalog-constructor-property-size-y')?.value || '',
            z: document.getElementById('catalog-constructor-property-size-z')?.value || ''
          };
          
          // ����������������
          node.nodeData.position = {
            x: document.getElementById('catalog-constructor-property-pos-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-pos-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-pos-z')?.value || '0'
          };
          
          // ����� ������� (anchor) - �������� �� �������� ������
          node.nodeData.anchor = {
            x: parseInt(document.querySelector('.anchor-btn[data-axis="x"][data-active="true"]')?.getAttribute('data-value') || '0'),
            y: parseInt(document.querySelector('.anchor-btn[data-axis="y"][data-active="true"]')?.getAttribute('data-value') || '0'),
            z: parseInt(document.querySelector('.anchor-btn[data-axis="z"][data-active="true"]')?.getAttribute('data-value') || '0')
          };
          
          // �������
          node.nodeData.rotation = {
            x: document.getElementById('catalog-constructor-property-rot-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-rot-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-rot-z')?.value || '0'
          };
          
          // �����������
          node.nodeData.comments = document.getElementById('catalog-constructor-property-comments')?.value || '';
          
          // �������
          node.nodeData.events = {
            on_before_params: document.getElementById('catalog-constructor-property-event-before-params')?.value || '',
            on_before_build: document.getElementById('catalog-constructor-property-event-before-build')?.value || '',
            on_after_build: document.getElementById('catalog-constructor-property-event-after-build')?.value || '',
            on_drag_end: document.getElementById('catalog-constructor-property-event-drag-end')?.value || ''
          };
          
          // ���� ��� ����������
          node.nodeData.fill_key = document.getElementById('catalog-constructor-property-fill-key')?.value || '';
          
          // ����� ��������
          node.nodeData.consider_size = document.getElementById('catalog-constructor-property-consider-size')?.checked || false;
          node.nodeData.consider_cuts = document.getElementById('catalog-constructor-property-consider-cuts')?.checked || false;
          node.nodeData.consider_intersections = document.getElementById('catalog-constructor-property-consider-intersections')?.checked || false;
          node.nodeData.show_nested = document.getElementById('catalog-constructor-property-show-nested')?.checked || false;
        }

        // ���������� ������ section (������/�������/anchor/�������) � ��� material/edges.
        function saveSectionNodeData(node) {
          if (!node?.nodeData) return;

          node.nodeData.size = {
            x: document.getElementById('catalog-constructor-property-size-x')?.value || '',
            y: document.getElementById('catalog-constructor-property-size-y')?.value || '',
            z: document.getElementById('catalog-constructor-property-size-z')?.value || '',
          };

          node.nodeData.position = {
            x: document.getElementById('catalog-constructor-property-pos-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-pos-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-pos-z')?.value || '0',
          };

          node.nodeData.anchor = {
            x: parseInt(document.querySelector('.anchor-btn[data-axis="x"][data-active="true"]')?.getAttribute('data-value') || '-1'),
            y: parseInt(document.querySelector('.anchor-btn[data-axis="y"][data-active="true"]')?.getAttribute('data-value') || '-1'),
            z: parseInt(document.querySelector('.anchor-btn[data-axis="z"][data-active="true"]')?.getAttribute('data-value') || '-1'),
          };

          node.nodeData.rotation = {
            x: document.getElementById('catalog-constructor-property-rot-x')?.value || '0',
            y: document.getElementById('catalog-constructor-property-rot-y')?.value || '0',
            z: document.getElementById('catalog-constructor-property-rot-z')?.value || '0',
          };

          const roleSel = document.getElementById('catalog-constructor-property-section-layout-role');
          const rawRole = roleSel?.value ?? '';
          node.nodeData.sectionLayoutRole =
            typeof window.__cldNormalizeSectionLayoutRole === 'function'
              ? window.__cldNormalizeSectionLayoutRole(rawRole)
              : String(rawRole || '').trim();

          node.nodeData.comments = document.getElementById('catalog-constructor-property-comments')?.value || '';
          node.nodeData.events = {
            on_before_params: document.getElementById('catalog-constructor-property-event-before-params')?.value || '',
            on_before_build: document.getElementById('catalog-constructor-property-event-before-build')?.value || '',
            on_after_build: document.getElementById('catalog-constructor-property-event-after-build')?.value || '',
            on_drag_end: document.getElementById('catalog-constructor-property-event-drag-end')?.value || '',
          };
        }

        function fillSectionProperties(nodeData) {
          const size = nodeData?.size || {};
          const pos = nodeData?.position || {};
          const anchor = nodeData?.anchor || { x: -1, y: -1, z: -1 };
          const rot = nodeData?.rotation || { x: '0', y: '0', z: '0' };

          const setVal = (id, v, fb = '') => {
            const el = document.getElementById(id);
            if (el) el.value = (v !== undefined && v !== null) ? String(v) : fb;
          };

          setVal('catalog-constructor-property-size-x', size.x, '');
          setVal('catalog-constructor-property-size-y', size.y, '');
          setVal('catalog-constructor-property-size-z', size.z, '');
          setVal('catalog-constructor-property-pos-x', pos.x, '0');
          setVal('catalog-constructor-property-pos-y', pos.y, '0');
          setVal('catalog-constructor-property-pos-z', pos.z, '0');
          setVal('catalog-constructor-property-rot-x', rot.x, '0');
          setVal('catalog-constructor-property-rot-y', rot.y, '0');
          setVal('catalog-constructor-property-rot-z', rot.z, '0');

          const roleSel = document.getElementById('catalog-constructor-property-section-layout-role');
          if (roleSel) {
            const raw = nodeData?.sectionLayoutRole ?? nodeData?.layout_role ?? '';
            const normalized =
              typeof window.__cldNormalizeSectionLayoutRole === 'function'
                ? window.__cldNormalizeSectionLayoutRole(raw)
                : String(raw || '').trim();
            roleSel.value = normalized || '';
          }

          updateAnchorButtons('x', Number(anchor.x ?? -1));
          updateAnchorButtons('y', Number(anchor.y ?? -1));
          updateAnchorButtons('z', Number(anchor.z ?? -1));
        }
        
        // ��������� �����
        function validateConstructorFields() {
          const nameInput = document.getElementById('catalog-constructor-property-name');
          const typeInput = document.getElementById('catalog-constructor-property-type');
          
          // ��������� ������������ ���� (���� �����)
          if (nameInput && nameInput.value.trim() === '') {
            nameInput.style.borderColor = '#dc3545';
            return false;
          } else if (nameInput) {
            nameInput.style.borderColor = '#d0d7e2';
          }
          
          // ��������� �������� ����� (�������, �������, ��������)
          const numericFields = [
            'catalog-constructor-property-size-x',
            'catalog-constructor-property-size-y',
            'catalog-constructor-property-size-z',
            'catalog-constructor-property-pos-x',
            'catalog-constructor-property-pos-y',
            'catalog-constructor-property-pos-z',
            'catalog-constructor-property-rot-x',
            'catalog-constructor-property-rot-y',
            'catalog-constructor-property-rot-z'
          ];
          
          let isValid = true;
          numericFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && field.value.trim() !== '') {
              const value = parseFloat(field.value);
              if (isNaN(value)) {
                field.style.borderColor = '#dc3545';
                isValid = false;
              } else {
                field.style.borderColor = '#d0d7e2';
              }
            }
          });
          
          return isValid;
        }
        
        // ������������� ������������ ��� ���� ����� ������ �������
        function initConstructorPropertiesHandlers() {
          // ����������� ��������� ����� - �������������� ����������
          const propertiesPanel = document.getElementById('constructor-properties-panel');
          if (!propertiesPanel) return;
          
          // ����������� ��� ���� input � select � ������ �������
          propertiesPanel.addEventListener('input', function(e) {
            if (currentSelectedNode) {
              // ��������� ������ ��� ��������� �����
              saveConstructorNodeData(currentSelectedNode);
            }
          });
          
          propertiesPanel.addEventListener('change', function(e) {
            if (currentSelectedNode) {
              saveConstructorNodeData(currentSelectedNode);
              // ��� � ����: ����� ��������� (� �.�. ����������) ������ ����� ��������� ������
              try { if (typeof update3DVisibility === 'function') update3DVisibility(currentSelectedNode); } catch {}
              try { if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe(); } catch {}
            }
          });
          
          // ����������� ��� ������ ����� ������� (anchor)
          const anchorButtons = document.querySelectorAll('.anchor-btn');
          anchorButtons.forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const axis = this.getAttribute('data-axis');
              const value = parseInt(this.getAttribute('data-value'));
              
              updateAnchorButtons(axis, value);
              
              if (currentSelectedNode) {
                // ���������, ��� ������������ ���� ����� anchor
                if (!currentSelectedNode.nodeData) currentSelectedNode.nodeData = {};
                currentSelectedNode.nodeData.anchor_user_set = true;

                // ��������� ��� � ���������: ������������ "����� �������" �� �������� ���
                // �������� � "�����" ������� ������ (����/�����/����� ��� ������������, ���/�����/���� ��� ��������������).
                const nodeType = currentSelectedNode.getAttribute('data-node-type');
                const detailTypeId = currentSelectedNode.getAttribute('data-detail-type') || currentSelectedNode.nodeData.detailType || '';
                if (nodeType === 'detail' && detailTypeId) {
                  // ���� "��� � ���������": ������ ��� � ������ ��������� ���,
                  // �� ��������� ��������� ��������� ������������.
                  const applyAxisSnap = (typeId, axisKey /* 'x'|'y'|'z' */) => {
                    const d = cldGetDetailDefaults(typeId);
                    if (!d) return;

                    currentSelectedNode.nodeData.detailType = typeId;
                    currentSelectedNode.setAttribute('data-detail-type', typeId);

                    // ������ orientation � nodeData � nodeData.spec ���������
                    if (!currentSelectedNode.nodeData.spec) currentSelectedNode.nodeData.spec = {};
                    if (d.spec?.orientation) {
                      currentSelectedNode.nodeData.orientation = d.spec.orientation;
                      currentSelectedNode.nodeData.spec.orientation = d.spec.orientation;
                    }
                    if (d.spec?.direction) currentSelectedNode.nodeData.spec.direction = d.spec.direction;

                    // �������: ������ ������ ���� ���, ��������� ��������� ��� ����
                    currentSelectedNode.nodeData.position = currentSelectedNode.nodeData.position || {};
                    if (d.pos && Object.prototype.hasOwnProperty.call(d.pos, axisKey)) {
                      currentSelectedNode.nodeData.position[axisKey] = d.pos[axisKey];
                    }

                    // Anchor: ������ ������ ���� ���, ��������� ���� �� �������� anchor ��� �� ������� �������
                    const curA = currentSelectedNode.nodeData.anchor || {};
                    const baseA = d.pivot || { x: -1, y: -1, z: -1 };
                    currentSelectedNode.nodeData.anchor = {
                      x: axisKey === 'x' ? baseA.x : (curA.x ?? baseA.x),
                      y: axisKey === 'y' ? baseA.y : (curA.y ?? baseA.y),
                      z: axisKey === 'z' ? baseA.z : (curA.z ?? baseA.z),
                    };
                  };

                  // ������������: X => left/middle/right
                  if (axis === 'x' && (detailTypeId === 'vertical_left' || detailTypeId === 'vertical_middle' || detailTypeId === 'vertical_right')) {
                    const nextType = value === -1 ? 'vertical_left' : (value === 0 ? 'vertical_middle' : 'vertical_right');
                    currentSelectedNode.nodeData.detailPosition = value === -1 ? 'vertical-left' : (value === 0 ? 'vertical-middle' : 'vertical-right');
                    applyAxisSnap(nextType, 'x');
                    // ������������� ����� pivot.x �� ��������� ������ (� �� �� ������� anchor)
                    currentSelectedNode.nodeData.anchor = {
                      ...(currentSelectedNode.nodeData.anchor || {}),
                      x: value,
                    };
                  }

                  // ��������������: Y => bottom/middle/top
                  if (axis === 'y' && (detailTypeId === 'horizontal_bottom' || detailTypeId === 'horizontal_middle' || detailTypeId === 'horizontal_top')) {
                    const nextType = value === -1 ? 'horizontal_bottom' : (value === 0 ? 'horizontal_middle' : 'horizontal_top');
                    currentSelectedNode.nodeData.detailPosition = value === -1 ? 'horizontal-bottom' : (value === 0 ? 'horizontal-middle' : 'horizontal-top');
                    applyAxisSnap(nextType, 'y');
                    currentSelectedNode.nodeData.anchor = {
                      ...(currentSelectedNode.nodeData.anchor || {}),
                      y: value,
                    };
                  }

                  // �����/���: Z => back/middle/front
                  if (axis === 'z' && (detailTypeId === 'back_front' || detailTypeId === 'front_middle' || detailTypeId === 'front_front')) {
                    const nextType = value === -1 ? 'back_front' : (value === 0 ? 'front_middle' : 'front_front');
                    currentSelectedNode.nodeData.detailPosition = value === -1 ? 'back' : (value === 0 ? 'front-middle' : 'front-front');
                    applyAxisSnap(nextType, 'z');
                    // ��� ��������� front_front pivot.z ������ ���� �� ������� (z=-1),
                    // ������� �� ���������� anchor.z ������� ��������� ������.
                  }
                }

                saveConstructorNodeData(currentSelectedNode);
                // ������� ������� ���� (�������/����� �������), ����� �� ���������� ������ ��������
                if (typeof fillDetailProperties === 'function' && currentSelectedNode.nodeData) {
                  fillDetailProperties(currentSelectedNode.nodeData);
                }
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          });
          
          // ���������� ������ "��" ��� ������� �� Y - ��������������� ������� ��� ������������ �������
          const posYOkBtn = document.getElementById('catalog-constructor-property-pos-y-ok');
          const posYInput = document.getElementById('catalog-constructor-property-pos-y');
          const sizeYInput = document.getElementById('catalog-constructor-property-size-y');
          
          if (posYOkBtn && posYInput && sizeYInput) {
            const handlePosYUpdate = () => {
              if (!currentSelectedNode) return;
              
              const detailTypeId = currentSelectedNode.getAttribute('data-detail-type');
              const isVertical = detailTypeId && (detailTypeId === 'vertical_left' || detailTypeId === 'vertical_right' || detailTypeId === 'vertical_middle');
              
              if (isVertical) {
                const posYValue = posYInput.value.trim();
                if (posYValue && posYValue !== '0') {
                  // ������������� ��������� ������ Y: @section.height - {posY}
                  const newSizeY = `@section.height - ${posYValue}`;
                  sizeYInput.value = newSizeY;
                  
                  // ��������� ���������
                  if (currentSelectedNode.nodeData) {
                    currentSelectedNode.nodeData.size = currentSelectedNode.nodeData.size || {};
                    currentSelectedNode.nodeData.size.y = newSizeY;
                  }
                } else {
                  // ���� posY = 0, ���������� ������ � �������
                  sizeYInput.value = '@section.height';
                  if (currentSelectedNode.nodeData) {
                    currentSelectedNode.nodeData.size = currentSelectedNode.nodeData.size || {};
                    currentSelectedNode.nodeData.size.y = '@section.height';
                  }
                }
                
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            };
            
            posYOkBtn.addEventListener('click', handlePosYUpdate);
            // ����� ����������� ��� ������ ������ (��� � Clodis)
            posYInput.addEventListener('blur', handlePosYUpdate);
          }
          
          // ����������� ��� ������ "��" � pos-x � pos-z
          const posXOkBtn = document.getElementById('catalog-constructor-property-pos-x-ok');
          const posZOkBtn = document.getElementById('catalog-constructor-property-pos-z-ok');
          
          if (posXOkBtn) {
            posXOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          if (posZOkBtn) {
            posZOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }

          // ����������� ��� ������ "��" � size-x, size-y, size-z (��� � ���������)
          const sizeXOkBtn = document.getElementById('catalog-constructor-property-size-x-ok');
          const sizeYOkBtn = document.getElementById('catalog-constructor-property-size-y-ok');
          const sizeZOkBtn = document.getElementById('catalog-constructor-property-size-z-ok');

          // �����: sizeYInput ��� �������� ���� (��� ��������������� �� posY).
          // ����� �� ������ ������, ����� ���������� ������ �����.
          const sizeXField = document.getElementById('catalog-constructor-property-size-x');
          const sizeYField = document.getElementById('catalog-constructor-property-size-y');
          const sizeZField = document.getElementById('catalog-constructor-property-size-z');

          const applySizeUpdate = () => {
            if (currentSelectedNode) {
              saveConstructorNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }
          };

          if (sizeXOkBtn) sizeXOkBtn.addEventListener('click', applySizeUpdate);
          if (sizeYOkBtn) sizeYOkBtn.addEventListener('click', applySizeUpdate);
          if (sizeZOkBtn) sizeZOkBtn.addEventListener('click', applySizeUpdate);

          // ����� ��������� �� blur (� ��������� ������ ������������ �������)
          if (sizeXField) sizeXField.addEventListener('blur', applySizeUpdate);
          if (sizeYField) sizeYField.addEventListener('blur', applySizeUpdate);
          if (sizeZField) sizeZField.addEventListener('blur', applySizeUpdate);
          
          // ����������� ��� ������ "��" � rot-x, rot-y, rot-z
          const rotXOkBtn = document.getElementById('catalog-constructor-property-rot-x-ok');
          const rotYOkBtn = document.getElementById('catalog-constructor-property-rot-y-ok');
          const rotZOkBtn = document.getElementById('catalog-constructor-property-rot-z-ok');
          
          if (rotXOkBtn) {
            rotXOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          if (rotYOkBtn) {
            rotYOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          if (rotZOkBtn) {
            rotZOkBtn.addEventListener('click', function() {
              if (currentSelectedNode) {
                saveConstructorNodeData(currentSelectedNode);
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              }
            });
          }
          
          // ������� ��� �������� ����������� ������ ����������
          function showVariableDropdown(button, fieldId) {
            // ��������� ���������� ���������� ������
            const existingDropdown = document.querySelector('.variable-dropdown');
            if (existingDropdown) {
              existingDropdown.remove();
            }
            
            const field = document.getElementById(fieldId);
            if (!field) return;

            // ������� ������ � ���� (��������� ��� � ���������: ������ + / -)
            function applyToken(token, op /* '+' | '-' */) {
              const cur = String(field.value || '').trim();
              const tok = String(token || '').trim();
              if (!tok) return;

              let next;
              if (!cur) {
                next = tok;
              } else if (op === '-') {
                next = `${cur} - ${tok}`;
              } else {
                next = `${cur} + ${tok}`;
              }

              field.value = next;
              field.dispatchEvent(new Event('input', { bubbles: true }));
              if (currentSelectedNode) saveConstructorNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }

            // ������ ��� ���� (������ ��� � ���������)
            const groups = [
              {
                title: '�������',
                items: [
                  { token: '@section.width', label: '������ ������ (@section.width)' },
                  { token: '@section.height', label: '������ ������ (@section.height)' },
                  { token: '@section.depth', label: '������� ������ (@section.depth)' },
                ],
              },
              {
                title: '����������',
                items: [
                  { token: '$wall.thickness', label: '������� ������ ($wall.thickness)' },
                ],
              },
              {
                title: '���������',
                items: [
                  { token: '#material.group0.thickness', label: '������� ��������� ������ 0 (#material.group0.thickness)' },
                ],
              },
            ];

            // ������ ���������� ������
            const dropdown = document.createElement('div');
            dropdown.className = 'variable-dropdown';
            dropdown.style.cssText = 'position:absolute; background:white; border:1px solid #d0d7e2; border-radius:6px; box-shadow:0 6px 18px rgba(0,0,0,0.12); z-index:10000; max-height:240px; overflow-y:auto; min-width:320px;';

            groups.forEach((group, gi) => {
              const header = document.createElement('div');
              header.textContent = group.title;
              header.style.cssText = 'padding:10px 12px; font-size:12px; font-weight:700; color:#333; background:#fafafa; border-bottom:1px solid #f0f0f0;';
              dropdown.appendChild(header);

              group.items.forEach((it, ii) => {
                const row = document.createElement('div');
                row.style.cssText = 'display:flex; align-items:center; gap:8px; padding:8px 12px; border-bottom:1px solid #f0f0f0;';

                const link = document.createElement('div');
                link.textContent = it.label;
                link.style.cssText = 'flex:1; font-size:12px; color:#0b5ed7; cursor:pointer; user-select:none;';
                link.onmouseover = () => (link.style.textDecoration = 'underline');
                link.onmouseout = () => (link.style.textDecoration = 'none');
                link.onclick = () => {
                  applyToken(it.token, '+');
                  dropdown.remove();
                };

                const btnPlus = document.createElement('button');
                btnPlus.type = 'button';
                btnPlus.textContent = '+';
                btnPlus.style.cssText = 'width:28px; height:28px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-weight:700; line-height:1;';
                btnPlus.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  applyToken(it.token, '+');
                  dropdown.remove();
                };

                const btnMinus = document.createElement('button');
                btnMinus.type = 'button';
                btnMinus.textContent = '−';
                btnMinus.style.cssText = 'width:28px; height:28px; border:1px solid #d0d7e2; border-radius:4px; background:#fff; cursor:pointer; font-weight:700; line-height:1;';
                btnMinus.onclick = (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  applyToken(it.token, '-');
                  dropdown.remove();
                };

                row.appendChild(link);
                row.appendChild(btnPlus);
                row.appendChild(btnMinus);
                dropdown.appendChild(row);
              });

              // ����������� ����� �������� (���� �������)
              if (gi < groups.length - 1) {
                const spacer = document.createElement('div');
                spacer.style.cssText = 'height:6px; background:#fff;';
                dropdown.appendChild(spacer);
              }
            });
            
            // ������������� ���������� ������
            const buttonRect = button.getBoundingClientRect();
            dropdown.style.top = (buttonRect.bottom + 2) + 'px';
            dropdown.style.left = buttonRect.left + 'px';
            
            document.body.appendChild(dropdown);
            
            // ��������� ��� ����� ��� ������
            const closeHandler = (e) => {
              if (!dropdown.contains(e.target) && e.target !== button) {
                dropdown.remove();
                document.removeEventListener('click', closeHandler);
              }
            };
            setTimeout(() => document.addEventListener('click', closeHandler), 0);
          }
          
          // ����������� ��� ������ "+{a}" (�������� ����������)
          document.querySelectorAll('.variable-btn-add').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              e.stopPropagation();
              const fieldId = this.getAttribute('data-field-id');
              if (fieldId) {
                showVariableDropdown(this, fieldId);
              }
            });
          });
          
          // ����������� ��� ������ "{aa}" (������������ ������ �����������)
          document.querySelectorAll('.variable-btn-mode').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const fieldId = this.getAttribute('data-field-id');
              const field = document.getElementById(fieldId);
              if (!field) return;
              
              // ����������� ����� "pretty" (� {}) � "real" (�������� ���������)
              const currentValue = field.value;
              // ���� ���������� ������ - ������ ����������/�������� �������� ������
              // � Clodis ��� ����� ������� ������
              this.textContent = this.textContent === '{aa}' ? 'a:a' : '{aa}';
            });
          });
          
          // ����������� ��� ������ "� 2" � "� 2"
          document.querySelectorAll('.math-btn-multiply').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const fieldId = this.getAttribute('data-field-id');
              const field = document.getElementById(fieldId);
              if (!field) return;
              
              const currentValue = field.value.trim();
              if (currentValue) {
                field.value = `(${currentValue}) * 2`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                if (currentSelectedNode) {
                  saveConstructorNodeData(currentSelectedNode);
                }
              }
            });
          });
          
          document.querySelectorAll('.math-btn-divide').forEach(btn => {
            btn.addEventListener('click', function(e) {
              e.preventDefault();
              const fieldId = this.getAttribute('data-field-id');
              const field = document.getElementById(fieldId);
              if (!field) return;
              
              const currentValue = field.value.trim();
              if (currentValue) {
                field.value = `(${currentValue}) / 2`;
                field.dispatchEvent(new Event('input', { bubbles: true }));
                if (currentSelectedNode) {
                  saveConstructorNodeData(currentSelectedNode);
                }
              }
            });
          });
        }

        function initSectionLayoutRoleSelectOptions() {
          const sel = document.getElementById('catalog-constructor-property-section-layout-role');
          if (!sel || sel.getAttribute('data-cld-roles-initialized') === '1') return;
          const roles = Array.isArray(window.__CLD_SECTION_LAYOUT_ROLES)
            ? window.__CLD_SECTION_LAYOUT_ROLES
            : [{ key: '', label: '(�� ������)' }];
          sel.innerHTML = '';
          roles.forEach((r) => {
            const opt = document.createElement('option');
            opt.value = r.key || '';
            opt.textContent = r.label || r.key || '(?)';
            sel.appendChild(opt);
          });
          sel.setAttribute('data-cld-roles-initialized', '1');
        }
        initSectionLayoutRoleSelectOptions();
        
        // ������������� ������������
        initConstructorPropertiesHandlers();
        
        // ���������� ������ "��������" � ������ �������
        const addButton = document.getElementById('catalog-constructor-property-add');
        if (addButton) {
          addButton.addEventListener('click', function() {
            if (!currentSelectedNode) {
              alert('������� �������� �������, � �������� ����� �������� �������� �������');
              return;
            }
            
            // ���������� ��� ������������ �������� �� ���� ����������
            const selectedType = currentSelectedNode.getAttribute('data-node-type') || 'section';
            
            // ������� ����� ������� (�� ��������� - ������)
            const newElementType = 'section'; // ����� ����� �������� ����� ��������� ����
            const newElement = createConstructorTreeNode(newElementType, currentSelectedNode);
            
            // ��������� � ������
            addTreeNodeToParent(newElement, currentSelectedNode);
            
            // �������� ����� �������
            selectTreeNode(newElement);
            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          });
        }
        
        // ���������� ������ "��������" ��� �������������
        const addComponentButton = document.getElementById('catalog-constructor-property-add-component');
        if (addComponentButton) {
          addComponentButton.addEventListener('click', function() {
            if (!currentSelectedNode) {
              alert('������� �������� �������');
              return;
            }
            openAccessoriesModal();
          });
        }
        
        // ���������� ������ "�������" ��� ��������� (��������: #catalog_modal_materials)
        const materialSelectLink = document.getElementById('catalog-constructor-property-material-select');
        if (materialSelectLink) {
          materialSelectLink.addEventListener('click', function(e) {
            e.preventDefault();
            if (!currentSelectedNode) {
              alert('������� �������� �������');
              return;
            }
            if (typeof window.openMaterialSelectModal === 'function') {
              window.openMaterialSelectModal();
            } else {
              console.error('[CLD][material] ❌ window.openMaterialSelectModal �� ����������!');
            }
          });
        } else {
          console.warn('[CLD][material] ⚠️ ������ catalog-constructor-property-material-select �� ������� � DOM');
        }
        
        // ������� �������� ���������� ���� ������ ��������� (���������� ��� ������� �� onclick)
        window.openMaterialSelectModal = function() {
          const modal = document.getElementById('material-select-modal');
          if (!modal) {
            console.error('[CLD][material] ��������� ���� �� �������');
            return;
          }
          modal.style.display = 'flex';
          loadMaterialsList();
        };
        
        // ������� �������� ���������� ���� ������ ��������� (���������� ��� ������� �� onclick)
        window.closeMaterialSelectModal = function() {
          const modal = document.getElementById('material-select-modal');
          if (modal) {
            modal.style.display = 'none';
          }
        };
        
        // ===== ��������� (clean-room) =====
        // ������ ���� �� public/data/*.json (��� API � ��� ���� ���������).
        window.__cldMaterialsLib = window.__cldMaterialsLib || null;
        window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
        window.__cldMaterialsLoading = window.__cldMaterialsLoading || null;

        async function __cldFetchJson(url) {
          const r = await fetch(url, { cache: 'no-store' });
          if (!r.ok) throw new Error(`HTTP ${r.status} for ${url}`);
          return await r.json();
        }
        // �������� �������������: ldsp/hdf → material_2/material_3
        function __cldNormalizeMaterialKey(key) {
          const legacy = { ldsp: 'material_2', hdf: 'material_3' };
          return (key && legacy[key]) ? legacy[key] : key;
        }

        async function __cldEnsureMaterialsLoaded() {
          if (window.__cldMaterialsLib) return window.__cldMaterialsLib;
          if (window.__cldMaterialsLoading) return window.__cldMaterialsLoading;

          window.__cldMaterialsLoading = (async () => {
            const [groups, apiKeysRaw] = await Promise.all([
              __cldFetchJson('/data/materials_groups.json'),
              fetch('/api/catalog/items_get/materials_keys', { cache: 'no-store' }).then(r => r.ok ? r.json() : []),
            ]);
            const apiKeys = Array.isArray(apiKeysRaw) ? apiKeysRaw : (apiKeysRaw?.items || []);

            // ������ keys � itemsByKey �� API (��� � "������ ����" � material_2, material_3)
            const keys = [];
            const itemsByKey = {};
            for (const m of apiKeys) {
              const id = m?.id;
              const name = (m?.name || '').toString().trim();
              if (!id) continue;
              const typeKey = `material_${id}`;
              keys.push({ key: typeKey, name: name || typeKey });
              try {
                const resp = await fetch(`/api/catalog/items_get/${typeKey}`, { cache: 'no-store' });
                const data = resp.ok ? await resp.json() : [];
                itemsByKey[typeKey] = Array.isArray(data) ? data : (data?.items || []);
              } catch (e) {
                if (window.__CLD_DEBUG) console.warn('[CLD][material] no items for', typeKey, e?.message || e);
                itemsByKey[typeKey] = [];
              }
            }

            window.__cldMaterialsLib = { groups: groups || [], keys, itemsByKey };
            return window.__cldMaterialsLib;
          })();

          try {
            return await window.__cldMaterialsLoading;
          } finally {
            window.__cldMaterialsLoading = null;
          }
        }
        // ������������ ��� ������������� ������
        window.__cldEnsureMaterialsLoaded = __cldEnsureMaterialsLoaded;

        function __cldBuildMaterialsPayload() {
          const lib = window.__cldMaterialsLib;
          const out = {};

          // ���� ���� lib ��� �� ��������� � ���������� ���� �� g0 �� ���� "������� ������"
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
          const groupSel = document.getElementById('catalog-constructor-property-material-group');
          const fallbackWt = Number(thickIn?.value);
          const defaultWt = Number.isFinite(fallbackWt) ? fallbackWt : 16;
          const uiGroupKey = groupSel?.value || 'g0';

          const defaultMatKey = (lib?.keys?.[0]?.key) || 'material_2';
          if (!lib) {
            out.g0 = {
              thickness: defaultWt,
              material: { key: defaultMatKey, id: 0, variant_id: 0 },
              material_icon: window.__cldMaterialsState?.groupOverrides?.g0?.material_icon || '',
            };
            return { vars: { _wt: defaultWt }, materials: out };
          }

          for (const g of lib.groups || []) {
            const key = g.key;
            if (!key) continue;
            const ov = window.__cldMaterialsState?.groupOverrides?.[key] || {};
            const materialKey = __cldNormalizeMaterialKey(ov.material_key || g.material) || defaultMatKey;
            const materialId = ov.material_id || 0;
            // UI-�������� (���� "������� ������") ������ ����� ��������� ��� ��������� ������,
            // ���� ���� ������� ���� �� ������ (����� override ����� �� ����������).
            const uiThickness = (key === uiGroupKey && Number.isFinite(fallbackWt)) ? fallbackWt : undefined;
            const thickness = Number(uiThickness ?? ov.thickness ?? g.thickness ?? (key === 'g0' ? defaultWt : 16));
            out[key] = {
              thickness,
              material: { key: materialKey, id: materialId, variant_id: 0 },
              material_icon: ov.material_icon || '',
            };
          }

          // �����������, ��� g0 ���������� ���� ���� lib.groups ������/�������������
          if (!out.g0) {
            const ov0 = window.__cldMaterialsState?.groupOverrides?.g0 || {};
            out.g0 = {
              thickness: Number((uiGroupKey === 'g0' && Number.isFinite(fallbackWt)) ? fallbackWt : (ov0.thickness ?? defaultWt)),
              material: { key: __cldNormalizeMaterialKey(ov0.material_key) || defaultMatKey, id: ov0.material_id || 0, variant_id: 0 },
              material_icon: ov0.material_icon || '',
            };
          }

          const g0t = out.g0?.thickness ?? defaultWt;
          return { vars: { _wt: Number(g0t) || defaultWt }, materials: out };
        }

        // ������������ ��� __ppSyncPreviewToIframe (���������� �������������)
        window.__cldBuildMaterialsPayload = __cldBuildMaterialsPayload;
        // ������� ��� ������� (� �������): __CLDDBG_MATERIALS()
        window.__CLDDBG_MATERIALS = function () {
          try {
            const lib = window.__cldMaterialsLib;
            const st = window.__cldMaterialsState;
            const payload = window.__cldBuildMaterialsPayload ? window.__cldBuildMaterialsPayload() : null;
            console.log('[CLD][materials][dbg]', {
              hasLib: !!lib,
              groups: lib?.groups,
              keys: lib?.keys,
              overrides: st?.groupOverrides,
              payload,
            });
          } catch (e) {
            console.warn('[CLD][materials][dbg] failed', e);
          }
        };

        async function __cldPopulateMaterialSelects() {
          const lib = await __cldEnsureMaterialsLoaded();
          const groupSel = document.getElementById('catalog-constructor-property-material-group');
          const keySel = document.getElementById('catalog-constructor-property-material-key');
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');

          if (groupSel) {
            groupSel.innerHTML = '';
            for (const g of lib.groups || []) {
              const opt = document.createElement('option');
              opt.value = g.key;
              opt.textContent = `${g.name || g.key} (${g.key})`;
              groupSel.appendChild(opt);
            }
            if (!groupSel.value) groupSel.value = 'g0';
          }

          if (keySel) {
            keySel.innerHTML = '';
            for (const k of lib.keys || []) {
              const opt = document.createElement('option');
              opt.value = k.key;
              opt.textContent = `${k.name || k.key} (${k.key})`;
              keySel.appendChild(opt);
            }
            if (!keySel.value) keySel.value = (lib.keys?.[0]?.key) || 'material_2';
          }

          // ������� ������: ���������� ������ ������ ��� override
          if (thickIn && groupSel) {
            const gk = groupSel.value || 'g0';
            const groupDef = (lib.groups || []).find((g) => g && g.key === gk);
            const ov = window.__cldMaterialsState?.groupOverrides?.[gk] || {};
            const v = Number(ov.thickness ?? groupDef?.thickness ?? 16);
            thickIn.value = Number.isFinite(v) ? String(v) : '';
          }
        }

        // ������� �������� ������ ���������� (��� ������� ������)
        async function loadMaterialsList() {
          const tbody = document.getElementById('material-select-modal-tbody');
          if (!tbody) return;
          tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">��������...</td></tr>';

          const lib = await __cldEnsureMaterialsLoaded();
          // �������� �������: ��������� �������� ��������� �� ������� "���������" ��� �������� � ����� ������������
          const ctx = window.__CLD_MATERIAL_MODAL_CONTEXT || null;
          const materialKey =
            (ctx && ctx.materialKey) ||
            document.getElementById('catalog-constructor-property-material-key')?.value ||
            (lib.keys?.[0]?.key) || 'material_2';
          const items = Array.isArray(lib.itemsByKey?.[materialKey]) ? lib.itemsByKey[materialKey] : [];

          const activeItems = items.filter((x) => x && x.active !== false);
          activeItems.sort((a, b) => Number(a.order || 0) - Number(b.order || 0));

          tbody.innerHTML = '';
          if (!activeItems.length) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:20px;">��������� �� �������</td></tr>';
            return;
          }

          activeItems.forEach((mat) => {
            const row = document.createElement('tr');
            row.innerHTML = `
              <td style="padding:8px; border:1px solid #ddd; width:70px;">${mat.id ?? ''}</td>
              <td style="padding:8px; border:1px solid #ddd;">${mat.name || ''}</td>
              <td style="padding:8px; border:1px solid #ddd; text-align:center; width:140px;">
                <a href="#" data-mat-id="${mat.id}" style="color:#007bff; text-decoration:none;">�������</a>
              </td>
            `;
            row.querySelector('a')?.addEventListener('click', (e) => {
              e.preventDefault();
              window.selectMaterialForNode(mat.id, mat.name || '');
            });
            tbody.appendChild(row);
          });
        }
        
        // ������� ������ ��������� ��� ���� (��������: show_swal_catalog)
        window.selectMaterialForNode = function(materialId, materialName) {
          if (!currentSelectedNode) {
            alert('������� �������� �������');
            return;
          }
          // ��������: ��������� material_id � material_name � nodeData
          if (!currentSelectedNode.nodeData) {
            currentSelectedNode.nodeData = {};
          }
          currentSelectedNode.nodeData.material_id = materialId;
          currentSelectedNode.nodeData.material_name = materialName;

          // ��������� override �� ������ (������� � ��������� ��������)
          const groupKey = document.getElementById('catalog-constructor-property-material-group')?.value || 'g0';
          const lib = window.__cldMaterialsLib;
          const materialKey = document.getElementById('catalog-constructor-property-material-key')?.value || (lib?.keys?.[0]?.key) || 'material_2';
          currentSelectedNode.nodeData.material_group = groupKey;
          currentSelectedNode.nodeData.material_key = materialKey;
          const item = Array.isArray(lib?.itemsByKey?.[materialKey])
            ? lib.itemsByKey[materialKey].find((x) => String(x.id) === String(materialId))
            : null;
          // ��������� ������ (���������� ��� texture url � ������/iframe)
          // �����: �������� ���� � ������ ������� �� item.texture (icon � ��� ����� ������ ������/�����).
          currentSelectedNode.nodeData.material_icon = (item?.texture || item?.texture_url || item?.image || item?.icon) || currentSelectedNode.nodeData.material_icon || '';
          const materialIcon = currentSelectedNode.nodeData.material_icon || '';
          const thickness = Number(item?.thickness);
          window.__cldMaterialsState.groupOverrides[groupKey] = {
            material_key: materialKey,
            material_id: materialId,
            material_icon: materialIcon,
            thickness: Number.isFinite(thickness) ? thickness : undefined,
          };

          // ����������� ������� ���������� ��������� � ���� "������� ������"
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
          if (thickIn && Number.isFinite(thickness)) thickIn.value = String(thickness);

          if (window.__CLD_DEBUG) {
          }
          
          // ��������� ����������� ���������� ���������
          updateMaterialDisplay();
          
          // ��������� ������ ����
        if (typeof saveDetailNodeData === 'function') {
          saveDetailNodeData(currentSelectedNode);
        }
          
          // ��������� 3D ������
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
          
          // ��������� ��������� ����
          if (typeof window.closeMaterialSelectModal === 'function') {
            window.closeMaterialSelectModal();
          }
        };
        
        // ������� ���������� ����������� ���������� ���������
        function updateMaterialDisplay() {
          const displayElement = document.getElementById('catalog-constructor-property-material-display');
          if (!displayElement || !currentSelectedNode) return;
          
          const materialId = currentSelectedNode.nodeData?.material_id;
          const materialName = currentSelectedNode.nodeData?.material_name;
          
          if (materialId && materialName) {
            displayElement.textContent = `${materialId} ${materialName}`;
            displayElement.style.color = '#333';
          } else {
            displayElement.textContent = '�� ������';
            displayElement.style.color = '#666';
          }
        }

        // ������������� ����������: ��������� ������� � ����� �������������� ������ �� ������� g0
        __cldPopulateMaterialSelects().then(() => {
          const groupSel = document.getElementById('catalog-constructor-property-material-group');
          const keySel = document.getElementById('catalog-constructor-property-material-key');
          const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
          const onMaterialUiChange = () => {
            // ������� ������: ����� override ������ (����� ��� ����������� ���� ������ �� ���������)
            const gk = groupSel?.value || 'g0';
            const n = Number(thickIn?.value);
            window.__cldMaterialsState.groupOverrides[gk] = {
              ...(window.__cldMaterialsState.groupOverrides[gk] || {}),
              thickness: Number.isFinite(n) ? n : undefined,
              // ��������� ���� ��������� ���� ��������� � override, ����� payload ��� ����������
              ...(keySel?.value ? { material_key: keySel.value } : {}),
            };

              if (window.__CLD_DEBUG) {
              }

            // ���� ������ ���� � ��������� material_group/material_key � nodeData
            if (currentSelectedNode && currentSelectedNode.nodeData) {
              currentSelectedNode.nodeData.material_group = gk;
              currentSelectedNode.nodeData.material_key = keySel?.value || (window.__cldMaterialsLib?.keys?.[0]?.key) || 'material_2';
              saveConstructorNodeData(currentSelectedNode);
              updateMaterialDisplay();
            }

            if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          };
          groupSel && groupSel.addEventListener('change', onMaterialUiChange);
          keySel && keySel.addEventListener('change', onMaterialUiChange);
          thickIn && thickIn.addEventListener('input', onMaterialUiChange);
            thickIn && thickIn.addEventListener('change', onMaterialUiChange);
            thickIn && thickIn.addEventListener('blur', onMaterialUiChange);
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
        }).catch((e) => console.warn('[CLD][material] failed to init materials', e));
        
        // ����������� ������ "�������" ��� ������ 1-4 (��������: show_edges_modal / ����� ������, ��� � ����)
        for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
          const edgeSelectBtn = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-select`);
          if (edgeSelectBtn) {
            edgeSelectBtn.addEventListener('click', function(e) {
              e.preventDefault();
              if (!currentSelectedNode) {
                alert('������� �������� �������');
                return;
              }
              if (typeof window.openEdgeDecorSelectForDetail === 'function') {
                window.openEdgeDecorSelectForDetail(edgeNum);
              }
            });
          }
        }
        
        // ������� �������� ���������� ���� ������ ���� ������ (���������� ��� ������� �� onclick)
        window.openEdgeTypeSelectModal = function(edgeNumber) {
          const modal = document.getElementById('edge-type-select-modal');
          if (!modal) {
            console.error('[CLD][edge] ❌ ��������� ���� edge-type-select-modal �� ������� � DOM');
            return;
          }
          // ��������� ����� ������ � data-�������� ���������� ����
          modal.setAttribute('data-edge-number', edgeNumber);
          modal.style.display = 'flex';
          loadEdgeTypesList();
        };
        
        // ������� �������� ���������� ���� ������ ���� ������ (���������� ��� ������� �� onclick)
        window.closeEdgeTypeSelectModal = function() {
          const modal = document.getElementById('edge-type-select-modal');
          if (modal) {
            modal.style.display = 'none';
            modal.removeAttribute('data-edge-number');
          }
        };
        
        // ������� �������� ������ ����� ������ (��������: catalog_items ��� ������)
        function loadEdgeTypesList() {
          const tbody = document.getElementById('edge-type-select-modal-tbody');
          if (!tbody) {
            console.error('[CLD][edge] tbody �� ������');
            return;
          }
          
          // ������� �������
          tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">��������...</td></tr>';
          
          // ��������: ��������� ������ ����� ������ �� API
          // TODO: �������� �� �������� API endpoint
          // ���� ���������� ���-������ ��� ������������
          setTimeout(() => {
            const mockEdgeTypes = [
              { id: 'butts', name: '����� �� ���������', active: 1 },
              { id: 'butts_l1', name: '������ ����� 1', active: 1 },
              { id: 'butts_l2', name: '������ ����� 2', active: 1 },
              { id: 'butts_w1', name: '������ ������� 1', active: 1 },
              { id: 'butts_w2', name: '������ ������� 2', active: 1 },
              { id: 'butts_facade', name: '������ ��������', active: 1 }
            ];
            
            tbody.innerHTML = '';
            const activeTypes = mockEdgeTypes.filter(t => t.active == 1);
            if (activeTypes.length > 0) {
              activeTypes.forEach(edgeType => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.onmouseover = function() { this.style.background = '#f5f5f5'; };
                row.onmouseout = function() { this.style.background = ''; };
                
                row.innerHTML = `
                  <td style="padding:8px; border:1px solid #ddd;">${edgeType.name || edgeType.id}</td>
                  <td style="padding:8px; border:1px solid #ddd; text-align:center; width:110px;">
                    <a href="#" onclick="selectEdgeTypeForNode('${edgeType.id}', '${(edgeType.name || edgeType.id).replace(/'/g, "\\'")}'); return false;" style="color:#007bff; text-decoration:none;">��������</a>
                  </td>
                `;
                tbody.appendChild(row);
              });
            } else {
              tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">���� ������ �� �������</td></tr>';
            }
          }, 300);
        }
        
        // ������� ������ ���� ������ ��� ���� (��������: show_swal_catalog ��� ������)
        window.selectEdgeTypeForNode = function(edgeTypeId, edgeTypeName) {
          if (!currentSelectedNode) {
            alert('������� �������� �������');
            return;
          }
          
          const modal = document.getElementById('edge-type-select-modal');
          const edgeNumber = modal ? modal.getAttribute('data-edge-number') : null;
          
          if (!edgeNumber) {
            console.error('[CLD][edge] ����� ������ �� ������');
            return;
          }
          // ��������: ��������� edge_type � nodeData.edges[edgeNumber]
          if (!currentSelectedNode.nodeData) {
            currentSelectedNode.nodeData = {};
          }
          if (!currentSelectedNode.nodeData.edges) {
            currentSelectedNode.nodeData.edges = {};
          }
          if (!currentSelectedNode.nodeData.edges[edgeNumber]) {
            currentSelectedNode.nodeData.edges[edgeNumber] = {};
          }
          
          currentSelectedNode.nodeData.edges[edgeNumber].type = edgeTypeId;
          currentSelectedNode.nodeData.edges[edgeNumber].type_name = edgeTypeName;
          
          // ��������� dropdown "���" ��� ��������� ������
          const edgeTypeSelect = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-type`);
          if (edgeTypeSelect) {
            // ���������, ���� �� ��� ����� option
            let optionExists = false;
            for (let i = 0; i < edgeTypeSelect.options.length; i++) {
              if (edgeTypeSelect.options[i].value === edgeTypeId) {
                optionExists = true;
                break;
              }
            }
            
            if (!optionExists) {
              // ��������� ����� option
              const newOption = document.createElement('option');
              newOption.value = edgeTypeId;
              newOption.textContent = edgeTypeName || edgeTypeId;
              edgeTypeSelect.appendChild(newOption);
            }
            
            // ������������� ��������� ��������
            edgeTypeSelect.value = edgeTypeId;
          }
          
          // ��������� ������ ����
          if (typeof saveDetailNodeData === 'function') {
            saveDetailNodeData(currentSelectedNode);
          }
          
          // ��������� 3D ������
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
          
          // ��������� ��������� ����
          if (typeof window.closeEdgeTypeSelectModal === 'function') {
            window.closeEdgeTypeSelectModal();
          }
        };
        
        // ����������� ������ "�������" ��� ������ 1-4 (����������� ���� � ����� �������������� �� ����� ������ ������)
        for (let edgeNum = 1; edgeNum <= 4; edgeNum++) {
          const edgeSelectBtn = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-select`);
          if (edgeSelectBtn) {
            edgeSelectBtn.addEventListener('click', function(e) {
              e.preventDefault();
              if (!currentSelectedNode) {
                alert('������� �������� �������');
                return;
              }
              if (typeof window.openEdgeDecorSelectForDetail === 'function') {
                window.openEdgeDecorSelectForDetail(edgeNum);
              }
            });
          }
        }
        
        // ������� �������� ���������� ���� ������ ���� ������ (���������� ��� ������� �� onclick)
        window.openEdgeTypeSelectModal = function(edgeNumber) {
          const modal = document.getElementById('edge-type-select-modal');
          if (!modal) {
            console.error('[CLD][edge] ❌ ��������� ���� edge-type-select-modal �� ������� � DOM');
            return;
          }
          // ��������� ����� ������ � data-�������� ���������� ����
          modal.setAttribute('data-edge-number', edgeNumber);
          modal.style.display = 'flex';
          loadEdgeTypesList();
        };
        
        // ������� �������� ���������� ���� ������ ���� ������ (���������� ��� ������� �� onclick)
        window.closeEdgeTypeSelectModal = function() {
          const modal = document.getElementById('edge-type-select-modal');
          if (modal) {
            modal.style.display = 'none';
            modal.removeAttribute('data-edge-number');
          }
        };
        
        // ������� �������� ������ ����� ������ (��������: catalog_items ��� ������)
        function loadEdgeTypesList() {
          const tbody = document.getElementById('edge-type-select-modal-tbody');
          if (!tbody) {
            console.error('[CLD][edge] tbody �� ������');
            return;
          }
          
          // ������� �������
          tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">��������...</td></tr>';
          
          // ��������: ��������� ������ ����� ������ �� API
          // TODO: �������� �� �������� API endpoint
          // ���� ���������� ���-������ ��� ������������
          setTimeout(() => {
            const mockEdgeTypes = [
              { id: 'butts', name: '����� �� ���������', active: 1 },
              { id: 'butts_l1', name: '������ ����� 1', active: 1 },
              { id: 'butts_l2', name: '������ ����� 2', active: 1 },
              { id: 'butts_w1', name: '������ ������� 1', active: 1 },
              { id: 'butts_w2', name: '������ ������� 2', active: 1 },
              { id: 'butts_facade', name: '������ ��������', active: 1 }
            ];
            
            tbody.innerHTML = '';
            const activeTypes = mockEdgeTypes.filter(t => t.active == 1);
            if (activeTypes.length > 0) {
              activeTypes.forEach(edgeType => {
                const row = document.createElement('tr');
                row.style.cursor = 'pointer';
                row.onmouseover = function() { this.style.background = '#f5f5f5'; };
                row.onmouseout = function() { this.style.background = ''; };
                
                row.innerHTML = `
                  <td style="padding:8px; border:1px solid #ddd;">${edgeType.name || edgeType.id}</td>
                  <td style="padding:8px; border:1px solid #ddd; text-align:center; width:110px;">
                    <a href="#" onclick="selectEdgeTypeForNode('${edgeType.id}', '${(edgeType.name || edgeType.id).replace(/'/g, "\\'")}'); return false;" style="color:#007bff; text-decoration:none;">��������</a>
                  </td>
                `;
                tbody.appendChild(row);
              });
            } else {
              tbody.innerHTML = '<tr><td colspan="2" style="text-align:center; padding:20px;">���� ������ �� �������</td></tr>';
            }
          }, 300);
        }
        
        // ������� ������ ���� ������ ��� ���� (��������: show_swal_catalog ��� ������)
        window.selectEdgeTypeForNode = function(edgeTypeId, edgeTypeName) {
          if (!currentSelectedNode) {
            alert('������� �������� �������');
            return;
          }
          
          const modal = document.getElementById('edge-type-select-modal');
          const edgeNumber = modal ? modal.getAttribute('data-edge-number') : null;
          
          if (!edgeNumber) {
            console.error('[CLD][edge] ����� ������ �� ������');
            return;
          }
          // ��������: ��������� edge_type � nodeData.edges[edgeNumber]
          if (!currentSelectedNode.nodeData) {
            currentSelectedNode.nodeData = {};
          }
          if (!currentSelectedNode.nodeData.edges) {
            currentSelectedNode.nodeData.edges = {};
          }
          if (!currentSelectedNode.nodeData.edges[edgeNumber]) {
            currentSelectedNode.nodeData.edges[edgeNumber] = {};
          }
          
          currentSelectedNode.nodeData.edges[edgeNumber].type = edgeTypeId;
          currentSelectedNode.nodeData.edges[edgeNumber].type_name = edgeTypeName;
          
          // ��������� dropdown "���" ��� ��������� ������
          const edgeTypeSelect = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-type`);
          if (edgeTypeSelect) {
            // ���������, ���� �� ��� ����� option
            let optionExists = false;
            for (let i = 0; i < edgeTypeSelect.options.length; i++) {
              if (edgeTypeSelect.options[i].value === edgeTypeId) {
                optionExists = true;
                break;
              }
            }
            
            if (!optionExists) {
              // ��������� ����� option
              const newOption = document.createElement('option');
              newOption.value = edgeTypeId;
              newOption.textContent = edgeTypeName || edgeTypeId;
              edgeTypeSelect.appendChild(newOption);
            }
            
            // ������������� ��������� ��������
            edgeTypeSelect.value = edgeTypeId;
          }
          
          // ��������: ��������� ����������� ��������� ������ (��� � Clodis)
          const edgeSelectedId = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-selected-id`);
          const edgeSelectedName = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-selected-name`);
          const edgeLink = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-link`);
          const edgeRemove = document.getElementById(`catalog-constructor-property-edge-${edgeNumber}-remove`);
          
          if (edgeSelectedId) {
            edgeSelectedId.textContent = edgeTypeId + ':';
            edgeSelectedId.style.display = 'inline';
          }
          if (edgeSelectedName) {
            edgeSelectedName.textContent = edgeTypeName || edgeTypeId;
            edgeSelectedName.style.display = 'inline';
          }
          if (edgeLink) {
            edgeLink.style.display = 'inline-block';
            // TODO: ���������� ���������� href ��� ������ �� ������
          }
          if (edgeRemove) {
            edgeRemove.style.display = 'inline-block';
          }
          
          // ��������� ������ ����
          if (typeof saveDetailNodeData === 'function') {
            saveDetailNodeData(currentSelectedNode);
          }
          
          // ��������� 3D ������
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
          
          // ��������� ��������� ����
          if (typeof window.closeEdgeTypeSelectModal === 'function') {
            window.closeEdgeTypeSelectModal();
          }
        };
        
        // ��������: ���������� ������� ��� �������� "��������� ������ �����������"
        // ���������� ������������� ������� ��� ����������� ����������� ���������
        const propertiesPanel = document.getElementById('constructor-properties-panel') || document.body;
        propertiesPanel.addEventListener('change', function(e) {
          const target = e.target;
          
          // ��������� �������� "��������� ������ �����������"
          if (target && target.id === 'catalog-constructor-property-edge-numbering') {
            const isChecked = target.checked;
            // ��������: ��� ������ ������� ����������� ������ ������
            const edgesListContainer = document.getElementById('catalog-constructor-edges-list-container');
            if (edgesListContainer) {
              edgesListContainer.style.display = isChecked ? 'block' : 'none';
            }
            
            // ��������� ������ ����
            if (currentSelectedNode && typeof saveDetailNodeData === 'function') {
              saveDetailNodeData(currentSelectedNode);
            }
            
            // ��������� 3D ������
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
            }
          }
          
          // ��������: ��������� ��������� ������ 1-4 (����������/�������� ������)
          if (target && target.id && target.id.startsWith('catalog-constructor-property-edge-') && 
              target.id.match(/^catalog-constructor-property-edge-[1-4]$/)) {
            const edgeNum = target.id.replace('catalog-constructor-property-edge-', '');
            const isChecked = target.checked;
            const detailsDiv = document.getElementById(`catalog-constructor-property-edge-${edgeNum}-details`);
            
            // ��������: ������ 1 ������ ���������� ������, ��������� - ������ ���� ��������
            if (detailsDiv) detailsDiv.style.display = isChecked ? 'block' : 'none';
            
            // ��������� ������ ����
            if (currentSelectedNode && typeof saveDetailNodeData === 'function') {
              saveDetailNodeData(currentSelectedNode);
            }
            
            // ��������� 3D ������
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
            }
          }
        });
        
        // ������� �������� ���������� ���� �������������
        function openAccessoriesModal() {
          const modal = document.getElementById('accessories-modal');
          if (!modal) {
            console.error('[CLD][accessories] ��������� ���� �� �������');
            return;
          }
          // target = ��������� ���� ������������
          window.__CLD_ACCESSORIES_TARGET = { kind: 'node' };
          modal.style.display = 'flex';
          loadAccessoriesList();
        }

        // ������� ������� ������������� ��� ������� (������� "�������")
        window.openAccessoriesModalForTemplate = function(templateId) {
          const modal = document.getElementById('accessories-modal');
          if (!modal) return;
          window.__CLD_ACCESSORIES_TARGET = { kind: 'template', templateId: String(templateId || '') };
          modal.style.display = 'flex';
          loadAccessoriesList();
        };
        
        // ������� �������� ���������� ���� ������������� (���������� ��� ������� �� onclick)
        window.closeAccessoriesModal = function() {
          const modal = document.getElementById('accessories-modal');
          if (modal) {
            modal.style.display = 'none';
          }
        };
        
        // ������� �������� ������ �������������
        function loadAccessoriesList() {
          const tbody = document.getElementById('cld-accessories-tbody');
          if (!tbody) return;
          const q = document.getElementById('cld-accessories-search');
          
          // ������� �������
          tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">��������...</td></tr>';

          const escapeAttr = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
          const norm = (s) => String(s || '').toLowerCase();
          const renderRows = (items) => {
            const qq = norm(q?.value || '');
            const filtered = (items || []).filter((acc) => {
              if (!qq) return true;
              return norm(acc.id).includes(qq) || norm(acc.name).includes(qq) || norm(acc.sku || acc.article || '').includes(qq) || norm(acc.category || '').includes(qq);
            });
            tbody.innerHTML = '';
            if (!filtered.length) {
              tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">������������� �� �������</td></tr>';
              return;
            }
            filtered.slice(0, 500).forEach((acc) => {
              const row = document.createElement('tr');
              const id = String(acc.id || '');
              const name = String(acc.name || '');
              const sku = String(acc.sku || acc.article || '');
              const category = String(acc.category || acc.type || '');
              row.innerHTML = `
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(id)}</td>
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(name)}</td>
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(sku)}</td>
                <td style="padding:8px; border:1px solid #ddd;">${escapeAttr(category)}</td>
                <td style="padding:8px; border:1px solid #ddd;">
                  <button class="btn btn-sm btn-primary"
                          onclick="addAccessoryToNode('${escapeAttr(id)}','${escapeAttr(name)}','${escapeAttr(sku)}','${escapeAttr(category)}')"
                          style="padding:4px 12px; font-size:12px;">
                    ��������
                  </button>
                </td>
              `;
              tbody.appendChild(row);
            });
          };

          const setCatalog = (items) => {
            window.__CLD_ACCESSORIES_CATALOG = Array.isArray(items) ? items : [];
            if (q && !q.__cldBound) {
              q.addEventListener('input', () => renderRows(window.__CLD_ACCESSORIES_CATALOG));
              q.__cldBound = true;
            }
            renderRows(window.__CLD_ACCESSORIES_CATALOG);
          };

          // 1) ��������� �� ���������� ������������� (������� "�������������")
          const lib = window.__cldAccessoriesLib;
          if (lib && lib.items && typeof lib.items === 'object') {
            const flatItems = [];
            Object.entries(lib.items).forEach(([typeKey, typeItems]) => {
              if (Array.isArray(typeItems)) {
                typeItems.forEach(item => {
                  if (item && item.id) {
                    flatItems.push({
                      id: String(item.id),
                      name: String(item.name || ''),
                      sku: String(item.sku || item.code || ''),
                      article: String(item.sku || item.code || ''),
                      category: String(typeKey || item.category || ''),
                    });
                  }
                });
              }
            });
            if (flatItems.length) {
              setCatalog(flatItems);
              return;
            }
          }

          // 2) ���� ��� ��������� � ��������������
          if (Array.isArray(window.__CLD_ACCESSORIES_CATALOG) && window.__CLD_ACCESSORIES_CATALOG.length) {
            setCatalog(window.__CLD_ACCESSORIES_CATALOG);
            return;
          }

          // 2) �������� ��������� �� ���������� json ��������� (��� ����)
          fetch('/data/bootstrap/get_settings_ajax.json')
            .then(r => r.json())
            .then((data) => {
              // best-effort extraction: ���� ���� � items (map ��� array)
              const out = [];
              const seen = new Set();
              const walk = (v, depth = 0) => {
                if (!v || depth > 6) return;
                if (Array.isArray(v)) {
                  v.forEach(x => walk(x, depth + 1));
                  return;
                }
                if (typeof v !== 'object') return;
                // candidates: { items: {id: {name, code/sku}} } ��� { accessories: {items:...} }
                if (v.items && (typeof v.items === 'object')) {
                  const vals = Array.isArray(v.items) ? v.items : Object.values(v.items);
                  for (const it of vals) {
                    if (!it || typeof it !== 'object') continue;
                    const id = it.id ?? it.ID ?? it.item_id ?? it.code ?? it.sku;
                    const name = it.name ?? it.Name ?? it.title;
                    const article = it.SKU ?? it.sku ?? it.code ?? it.article ?? it.vendor_code ?? '';
                    const category = it.category_name ?? it.category ?? it.group ?? '';
                    if (id == null || !name) continue;
                    const key = String(id);
                    if (seen.has(key)) continue;
                    seen.add(key);
                    out.push({ id: key, name: String(name), article: String(article || ''), category: String(category || '') });
                  }
                }
                for (const k of Object.keys(v)) walk(v[k], depth + 1);
              };
              walk(data, 0);

              if (out.length) setCatalog(out);
              else {
                // fallback mock
                setCatalog([
                  { id: '1', name: '����� ���������', article: 'HANDLE-001', category: '���������' },
                  { id: '2', name: '����� ���������', article: 'HINGE-001', category: '���������' },
                  { id: '3', name: '������������ ��� �����', article: 'SLIDE-001', category: '���������' },
                  { id: '4', name: '���������', article: 'FOOT-001', category: '���������' },
                  { id: '5', name: '��������������', article: 'SHELF-001', category: '���������' },
                ]);
              }
            })
            .catch(() => {
              setCatalog([
                { id: '1', name: '����� ���������', article: 'HANDLE-001', category: '���������' },
                { id: '2', name: '����� ���������', article: 'HINGE-001', category: '���������' },
                { id: '3', name: '������������ ��� �����', article: 'SLIDE-001', category: '���������' },
                { id: '4', name: '���������', article: 'FOOT-001', category: '���������' },
                { id: '5', name: '��������������', article: 'SHELF-001', category: '���������' },
              ]);
            });
          
          // �������� �������� �� API (����������������� ����� ����� ����� endpoint):
          /*
          fetch('/api/accessories/list')
            .then(response => response.json())
            .then(data => {
              tbody.innerHTML = '';
              if (data && data.length > 0) {
                data.forEach(acc => {
                  const row = document.createElement('tr');
                  row.innerHTML = `
                    <td>${acc.id || ''}</td>
                    <td>${acc.name || ''}</td>
                    <td>${acc.article || ''}</td>
                    <td>${acc.category || ''}</td>
                    <td>
                      <button class="btn btn-sm btn-primary" onclick="addAccessoryToNode(${acc.id}, '${acc.name || ''}')">
                        ��������
                      </button>
                    </td>
                  `;
                  tbody.appendChild(row);
                });
              } else {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">������������� �� �������</td></tr>';
              }
            })
            .catch(error => {
              console.error('[CLD][accessories] ������ �������� ������:', error);
              tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px; color:#d00;">������ �������� ������ �������������</td></tr>';
            });
          */
        }
        
        // ������� ���������� �������������� � ����
        window.addAccessoryToNode = function(accessoryId, accessoryName, accessoryArticle, accessoryCategory) {
          const target = window.__CLD_ACCESSORIES_TARGET || { kind: 'node' };

          // === target: template (������� "�������") ===
          if (target.kind === 'template') {
            const root = document.getElementById('constructor-root-module');
            const tid = String(target.templateId || '');
            if (!root || !root.nodeData || !Array.isArray(root.nodeData.templates) || !tid) return;
            const tpl = root.nodeData.templates.find(t => String(t.id) === tid);
            if (!tpl) return;
            tpl.accessories = Array.isArray(tpl.accessories) ? tpl.accessories : [];

            const id = String(accessoryId || '');
            const name = String(accessoryName || '');
            const sku = String(accessoryArticle || '');
            const category = String(accessoryCategory || '');
            if (!id || !name) return;

            const idx = tpl.accessories.findIndex(a => a && String(a.id) === id);
            if (idx >= 0) {
              tpl.accessories[idx].count = Number(tpl.accessories[idx].count || 1) + 1;
            } else {
              tpl.accessories.push({ id, name, sku, category, count: 1, c: 1 });
            }

            try { window.__CLD_TEMPLATES_RENDER && window.__CLD_TEMPLATES_RENDER(); } catch {}
            closeAccessoriesModal();
            return;
          }

          // === target: node (�����������) ===
          if (!currentSelectedNode) {
            alert('������� �������� �������');
            return;
          }
          if (!currentSelectedNode.nodeData.accessories) currentSelectedNode.nodeData.accessories = [];
          const id = String(accessoryId || '');
          let existingIndex = -1;
          for (let i = 0; i < currentSelectedNode.nodeData.accessories.length; i++) {
            if (String(currentSelectedNode.nodeData.accessories[i].id) === id) { existingIndex = i; break; }
          }

          if (existingIndex >= 0) {
            currentSelectedNode.nodeData.accessories[existingIndex].count = (currentSelectedNode.nodeData.accessories[existingIndex].count || 1) + 1;
          } else {
            currentSelectedNode.nodeData.accessories.push({
              id,
              name: String(accessoryName || ''),
              sku: String(accessoryArticle || ''),
              category: String(accessoryCategory || ''),
              count: 1,
              c: 1
            });
          }

          updateAccessoriesList();
          if (typeof saveDetailNodeData === 'function') saveDetailNodeData(currentSelectedNode);
          if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
          closeAccessoriesModal();
        };
        
        // ������� ���������� ������ ������������� � ������ �������
        function updateAccessoriesList() {
          const listContainer = document.getElementById('catalog-constructor-property-accessories-list');
          if (!listContainer || !currentSelectedNode) return;
          
          const accessories = currentSelectedNode.nodeData.accessories || [];
          
          if (accessories.length === 0) {
            listContainer.innerHTML = '<div style="font-size:12px; color:#999; padding:8px 0;">��� ����������� �������������</div>';
            return;
          }
          
          const esc = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
          
          let html = '<div style="font-size:12px;">';
          accessories.forEach((acc, index) => {
            const count = Number(acc.count || 1);
            html += `
              <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid #f0f0f0;">
                <div style="flex:1; min-width:0;">
                  <div style="font-weight:500; margin-bottom:4px;">${esc(acc.name || '������������� #' + acc.id)}</div>
                  ${acc.sku ? `<div style="font-size:11px; color:#666;">�������: ${esc(acc.sku)}</div>` : ''}
                </div>
                <div style="display:flex; align-items:center; gap:8px; margin-left:12px;">
                  <label style="font-size:11px; color:#666; white-space:nowrap;">���-��:</label>
                  <input
                    type="number"
                    min="1"
                    class="form-control form-control-sm cld-acc-count"
                    data-acc-index="${index}"
                    value="${count}"
                    style="width:60px; padding:4px 6px; font-size:12px; text-align:center;"
                  />
                  <button 
                    class="btn btn-sm btn-outline-danger cld-acc-remove"
                    data-acc-index="${index}"
                    style="padding:2px 8px; font-size:11px; white-space:nowrap;"
                    title="�������"
                  >
                    �
                  </button>
                </div>
              </div>
            `;
          });
          html += '</div>';
          listContainer.innerHTML = html;

          // ����������� ��������� ����������
          listContainer.querySelectorAll('.cld-acc-count').forEach(input => {
            input.addEventListener('change', (e) => {
              const idx = Number(e.target?.getAttribute('data-acc-index'));
              if (!Number.isFinite(idx) || !accessories[idx]) return;
              const newCount = Math.max(1, Number(e.target.value) || 1);
              accessories[idx].count = newCount;
              if (typeof saveDetailNodeData === 'function') saveDetailNodeData(currentSelectedNode);
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            });
          });

          // ����������� ��������
          listContainer.querySelectorAll('.cld-acc-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
              const idx = Number(e.target?.getAttribute('data-acc-index'));
              if (!Number.isFinite(idx)) return;
              window.removeAccessoryFromNode(idx);
            });
          });
        }
        
        // ������� �������� ��������������
        window.removeAccessoryFromNode = function(index) {
          if (!currentSelectedNode || !currentSelectedNode.nodeData.accessories) return;
          
          currentSelectedNode.nodeData.accessories.splice(index, 1);
          
          // ��������� �����������
          updateAccessoriesList();
          
          // ��������� ������ ����
          if (typeof saveDetailNodeData === 'function') {
            saveDetailNodeData(currentSelectedNode);
          }
          
          // ��������� 3D ������
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }
        };
        
        // ������� ��� �������� ���������� ���� ���������� ��������
        function openAddElementModal(parentNode) {
          // ��������: �������� �������� �������
          // ��������: ��������� ������������� ������� � DOM
          const modal = document.getElementById('constructor-add-element-modal');
          const typeSelect = document.getElementById('constructor-add-modal-type');
          const nameInput = document.getElementById('constructor-add-modal-name');
          if (!modal || !typeSelect || !nameInput) {
            console.error('[CLD][modal] ❌ �������� ���������� ���� �� �������', {
              modal: !!modal,
              typeSelect: !!typeSelect,
              nameInput: !!nameInput,
              document_ready: document.readyState,
            });
            return;
          }

          // ������ ������ ����� (��� � admin-constructor.js); � HTML ������ section/detail � �������������
          const typeNames = {
            section: '������',
            fillable_section: '����������� ������',
            detail: '������',
            element: '�������',
            model: '������',
            facade: '�����',
            countertop: '����������',
            plinth: '������',
            fitting: '��������',
            cutout: '�����',
            animator: '��������',
            size: '������',
            mouse_target: '���� ��� ����',
            information: '����������',
            attachment_point: '����� ����������',
            module: '������',
            wall: '������',
          };
          const ADD_MODAL_TYPE_ORDER = [
            'section',
            'fillable_section',
            'detail',
            'wall',
            'plinth',
            'countertop',
            'facade',
            'fitting',
            'cutout',
            'module',
            'model',
            'element',
            'animator',
            'size',
            'mouse_target',
            'information',
            'attachment_point',
          ];
          typeSelect.innerHTML = '';
          ADD_MODAL_TYPE_ORDER.forEach((k) => {
            if (!typeNames[k]) return;
            const opt = document.createElement('option');
            opt.value = k;
            opt.textContent = typeNames[k];
            typeSelect.appendChild(opt);
          });

          // ����, ��� ������� ����� ����� �������� ������ (����� ������ � ��� ����� �����������)
          const MUST_PICK_DETAIL_LAYOUT = new Set([
            'detail',
            'plinth',
            'wall',
            'countertop',
            'fitting',
            'cutout',
            'element',
            'model',
            'module',
            'animator',
            'size',
            'mouse_target',
            'information',
            'attachment_point',
          ]);
          
          // ��������� ��� ����� �������
          const detailGridContainer = document.getElementById('constructor-add-modal-detail-grid-container');
          const detailGrid = document.getElementById('constructor-add-modal-detail-grid');
          let selectedDetailType = null;

          // ���� ������ ������
          const facadeContainer = document.getElementById('constructor-add-modal-facade-container');
          const facadeSelectedSpan = document.getElementById('constructor-add-modal-facade-selected');
          let selectedFacadeId = null;
          let selectedFacadeName = '';

          function setSelectedFacade(id, name) {
            selectedFacadeId = (id != null && id !== '') ? String(id) : null;
            selectedFacadeName = name || '';
            if (facadeSelectedSpan) {
              facadeSelectedSpan.textContent = selectedFacadeId
                ? (selectedFacadeId + ': ' + selectedFacadeName)
                : '';
            }
          }
          
          // ������� ��� ��������� ������ ������ �� canvas
          function drawDetailPreview(canvas, detailType) {
            const ctx = canvas.getContext('2d');
            if (!ctx) return;
            
            const size = canvas.width;
            const padding = 10;
            const boxSize = size - padding * 2;
            
            // �������
            ctx.fillStyle = '#f9f9f9';
            ctx.fillRect(0, 0, size, size);
            
            // ������ ����� ���� (wireframe) - ������-�����
            ctx.strokeStyle = '#d0d0d0';
            ctx.lineWidth = 1.5;
            
            // �������� ����� (�������)
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding + boxSize, padding);
            ctx.lineTo(padding + boxSize, padding + boxSize);
            ctx.lineTo(padding, padding + boxSize);
            ctx.closePath();
            ctx.stroke();
            
            // ������ ����� (������� ��� �����������)
            const offset = boxSize * 0.25;
            ctx.beginPath();
            ctx.moveTo(padding + offset, padding + offset);
            ctx.lineTo(padding + boxSize + offset, padding + offset);
            ctx.lineTo(padding + boxSize + offset, padding + boxSize + offset);
            ctx.lineTo(padding + offset, padding + boxSize + offset);
            ctx.closePath();
            ctx.stroke();
            
            // ����������� ����� (����� ����)
            ctx.beginPath();
            ctx.moveTo(padding, padding);
            ctx.lineTo(padding + offset, padding + offset);
            ctx.moveTo(padding + boxSize, padding);
            ctx.lineTo(padding + boxSize + offset, padding + offset);
            ctx.moveTo(padding + boxSize, padding + boxSize);
            ctx.lineTo(padding + boxSize + offset, padding + boxSize + offset);
            ctx.moveTo(padding, padding + boxSize);
            ctx.lineTo(padding + offset, padding + boxSize + offset);
            ctx.stroke();
            
            // ������ ������ (���������� ���������)
            ctx.fillStyle = '#d4af37';
            ctx.strokeStyle = '#b8941f';
            ctx.lineWidth = 1;
            
            let detailX = padding;
            let detailY = padding;
            let detailWidth = boxSize;
            let detailHeight = boxSize;
            
            // ���������������� � ������� ������ � ����������� �� ����
            const position = detailType.position;
            if (position === 'back-front' || position === 'vertical-left') {
              detailX = padding;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            } else if (position === 'vertical-right') {
              detailX = padding + boxSize - boxSize * 0.15;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            } else if (position === 'horizontal-top') {
              detailX = padding;
              detailY = padding;
              detailWidth = boxSize;
              detailHeight = boxSize * 0.15;
            } else if (position === 'horizontal-bottom') {
              detailX = padding;
              detailY = padding + boxSize - boxSize * 0.15;
              detailWidth = boxSize;
              detailHeight = boxSize * 0.15;
            } else if (position === 'vertical-middle') {
              detailX = padding + (boxSize - boxSize * 0.15) / 2;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            } else if (position === 'horizontal-middle') {
              detailX = padding;
              detailY = padding + (boxSize - boxSize * 0.15) / 2;
              detailWidth = boxSize;
              detailHeight = boxSize * 0.15;
            } else if (position === 'front-middle') {
              detailX = padding + boxSize - boxSize * 0.15;
              detailY = padding + (boxSize - boxSize * 0.3) / 2;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize * 0.3;
            } else if (position === 'front-front') {
              detailX = padding + boxSize - boxSize * 0.15;
              detailY = padding;
              detailWidth = boxSize * 0.15;
              detailHeight = boxSize;
            }
            
            // ������ ������
            ctx.fillRect(detailX, detailY, detailWidth, detailHeight);
            ctx.strokeRect(detailX, detailY, detailWidth, detailHeight);
          }
          
          // ���� ������� (��� � constructor.ts)
          const detailTypes = [
            // NOTE: orientation ����� � ��� UI, � export �� ����������� � {'v','h','f'}
            { id: 'back_front', name: '������ �����������', orientation: 'front', position: 'back-front' },
            { id: 'vertical_left', name: '������������ �����', orientation: 'vertical', position: 'vertical-left' },
            { id: 'vertical_right', name: '������������ ������', orientation: 'vertical', position: 'vertical-right' },
            { id: 'vertical_middle', name: '������������ �������', orientation: 'vertical', position: 'vertical-middle' },
            { id: 'horizontal_top', name: '�������������� �������', orientation: 'horizontal', position: 'horizontal-top' },
            { id: 'horizontal_bottom', name: '�������������� ������', orientation: 'horizontal', position: 'horizontal-bottom' },
            { id: 'horizontal_middle', name: '�������������� �������', orientation: 'horizontal', position: 'horizontal-middle' },
            { id: 'front_middle', name: '����������� �������', orientation: 'front', position: 'front-middle' },
            { id: 'front_front', name: '����������� ��������', orientation: 'front', position: 'front-front' }
          ];
          
          // ������� ��� �������� �������� ������ ������
          function createDetailPreviewItem(detailType) {
            const item = document.createElement('div');
            item.style.display = 'flex';
            item.style.flexDirection = 'column';
            item.style.alignItems = 'center';
            item.style.gap = '6px';
            item.style.cursor = 'pointer';
            
            const preview = document.createElement('div');
            preview.className = 'detail-type-preview-item';
            preview.dataset.detailType = detailType.id;
            preview.style.width = '100px';
            preview.style.height = '100px';
            preview.style.border = '2px solid #e0e0e0';
            preview.style.borderRadius = '6px';
            preview.style.padding = '4px';
            preview.style.background = '#fff';
            preview.style.transition = 'all 0.2s';
            preview.title = detailType.name;
            
            preview.onmouseenter = function() {
              this.style.borderColor = '#C5FF5D';
              this.style.transform = 'scale(1.05)';
            };
            preview.onmouseleave = function() {
              if (!this.classList.contains('selected')) {
                this.style.borderColor = '#e0e0e0';
                this.style.transform = 'scale(1)';
              }
            };
            
            // ������� canvas ��� ������
            const canvas = document.createElement('canvas');
            canvas.width = 100;
            canvas.height = 100;
            drawDetailPreview(canvas, detailType);
            preview.appendChild(canvas);
            
            preview.onclick = function() {
              // ������� ��������� � ������
              document.querySelectorAll('.detail-type-preview-item').forEach(p => {
                p.classList.remove('selected');
                p.style.borderColor = '#e0e0e0';
                p.style.background = '#fff';
              });
              // �������� �������
              this.classList.add('selected');
              this.style.borderColor = '#C5FF5D';
              this.style.background = '#f0f9ff';
              selectedDetailType = detailType.id;
            };
            
            const label = document.createElement('div');
            label.textContent = detailType.name;
            label.style.fontSize = '11px';
            label.style.color = '#666';
            label.style.textAlign = 'center';
            label.style.maxWidth = '110px';
            label.style.overflow = 'hidden';
            label.style.textOverflow = 'ellipsis';
            label.style.whiteSpace = 'nowrap';
            
            item.appendChild(preview);
            item.appendChild(label);
            
            return item;
          }
          
          // ������� ��� ���������� ����� �������
          function updateDetailGrid() {
            if (!detailGrid) return;
            
            detailGrid.innerHTML = '';

            const isFacade = typeSelect.value === 'facade';
            const showDetailGrid =
              isFacade || MUST_PICK_DETAIL_LAYOUT.has(typeSelect.value);

            // ��������/������ ���� "�����"
            if (facadeContainer) {
              facadeContainer.style.display = isFacade ? 'block' : 'none';
              if (!isFacade) {
                setSelectedFacade(null, '');
              }
            }
            
            if (showDetailGrid) {
              // ���������� ���������
              if (detailGridContainer) {
                detailGridContainer.style.display = 'block';
              }
              
              // ��������� ��� ���� ������� � �����
              detailTypes.forEach(detailType => {
                detailGrid.appendChild(createDetailPreviewItem(detailType));
              });
              
              // ���������� �����
              selectedDetailType = null;
            } else {
              // �������� ���������
              if (detailGridContainer) {
                detailGridContainer.style.display = 'none';
              }
              selectedDetailType = null;
            }
          }
          
          // ������ ���������� �� ������ "�������" ��� ������
          (function() {
            const facadeSelectLink = document.getElementById('constructor-add-modal-facade-select-link');
            if (facadeSelectLink && !facadeSelectLink.__cldHandlerAttached) {
              facadeSelectLink.__cldHandlerAttached = true;
              facadeSelectLink.addEventListener('click', function(e) {
                e.preventDefault();
                if (typeof window.openFacadePickerModal === 'function') {
                  window.openFacadePickerModal(function(id, name) {
                    setSelectedFacade(id, name);
                  });
                } else {
                  alert('������� ������ ������ ���� ���������� (openFacadePickerModal �� �������)');
                }
              });
            }
          })();

          // ��������� �������� ��� ��������� ����
          typeSelect.onchange = function() {
            nameInput.value = typeNames[typeSelect.value] || '����� �������';
            updateDetailGrid();
          };
          
          // ������������� ��������� ��������
          nameInput.value = typeNames[typeSelect.value] || '����� �������';
          
          // �������������� ����� �������
          updateDetailGrid();
          
          
          // �����: ���� ������� ��������� ������ �������� ����������, ���������� � � body
          // ��������� �� ������ display, �� � computed style ��������
          let needsMove = false;
          if (modal.parentElement) {
            const parentComputed = window.getComputedStyle(modal.parentElement);
            const parentDisplay = modal.parentElement.style.display || parentComputed.display;
            const parentVisibility = modal.parentElement.style.visibility || parentComputed.visibility;
            
            if (parentDisplay === 'none' || parentVisibility === 'hidden' || modal.offsetParent === null) {
              needsMove = true;
            }
          }
          
          if (needsMove) {
            document.body.appendChild(modal);
          }
          
          // ���������� ��������� ����
          modal.style.display = 'flex';
          
          // ������������� ������������� z-index ��� �������� ���������
          if (!modal.style.zIndex || modal.style.zIndex === '') {
            modal.style.zIndex = '10001';
          }
          
          // ����������� �������� ���������� ����
          const closeBtn = document.getElementById('constructor-add-modal-close');
          const cancelBtn = document.getElementById('constructor-add-modal-cancel');
          const addBtn = document.getElementById('constructor-add-modal-add');
          
          function closeModal() {
            if (modal) {
            modal.style.display = 'none';
            // ���������� ����� ������ � ������
            selectedDetailType = null;
            setSelectedFacade(null, '');
              if (detailGrid) {
                document.querySelectorAll('.detail-type-preview-item.selected').forEach(item => {
                  item.classList.remove('selected');
                  item.style.borderColor = '#e0e0e0';
                  item.style.background = '#fff';
                });
              }
            }
          }
          
          // ������� ������ ����������� � ��������� �����
          if (closeBtn) closeBtn.onclick = closeModal;
          if (cancelBtn) cancelBtn.onclick = closeModal;
          
          // ���������� ���������� ��������
          if (addBtn) {
          addBtn.onclick = function() {
              try {
            const selectedType = typeSelect.value;
            const elementName = nameInput.value.trim() || (typeNames[selectedType] || '����� �������');
            
            if (MUST_PICK_DETAIL_LAYOUT.has(selectedType) && !selectedDetailType) {
              alert('����������, �������� ��� ������ �� ����� ����');
              return;
            }
            
            // ������� ����� �� ���������� ���� � ���� ����� ������
            const typeMapping = {
              'section': 'section',
              'fillable_section': 'section',
              'detail': 'detail',
              'element': 'detail',
              'model': 'detail',
              'facade': 'detail',
              'countertop': 'detail',
              'plinth': 'detail',
              'fitting': 'detail',
              'cutout': 'detail',
              'animator': 'detail',
              'size': 'detail',
              'mouse_target': 'detail',
              'information': 'detail',
              'attachment_point': 'detail',
              'module': 'detail',
              'wall': 'detail',
            };
            
            const nodeType = typeMapping[selectedType] || 'section';
            
            // ⭐ ���� �� �������: ��������� ���������� � �������� ������
            if (selectedType === 'detail' && selectedDetailType) {
              const detailTypeInfo = detailTypes.find(dt => dt.id === selectedDetailType);
              const parentType = parentNode?.nodeData?.type || parentNode?.getAttribute('data-node-type') || '?';
              const parentName = parentNode?.nodeData?.name || parentNode?.querySelector('.tree-node-name')?.textContent || '?';
            }
            
            // ������� ����� ����
            const newNode = createConstructorTreeNode(nodeType, parentNode);
                if (!newNode) {
                  console.error('[CLD][modal] ❌ �� ������� ������� ����');
                  alert('������: �� ������� ������� �������');
                  return;
                }
                
            newNode.nodeData.name = elementName;
            newNode.setAttribute('data-node-name', elementName);
            newNode.nodeData.originalType = selectedType;

            // ���� ������ ����� � ���������: ���������� ����� � ��������� �������� ����� ������ (��. ClodisBuilder.buildFacade + applyTransform)
            if (selectedType === 'facade') {
              // ����������� � ������ ���������� ������� (g2), ��� � ���������
              if (!newNode.nodeData.material_group) {
                newNode.nodeData.material_group = 'g2';
              }
              if (selectedFacadeId != null) {
                newNode.nodeData.modelId = String(selectedFacadeId);
                if (selectedFacadeName) {
                  newNode.nodeData.modelKey = selectedFacadeName;
                }
              }
              newNode.nodeData.size = {
                x: '@section.width',
                y: '@section.height',
                z: 16
              };
              newNode.nodeData.position = { x: 0, y: 0, z: '@section.depth' };
              newNode.nodeData.anchor = { x: -1, y: -1, z: -1 };
              if (!newNode.nodeData.spec) newNode.nodeData.spec = {};
              newNode.nodeData.spec.orientation = 'f';
              newNode.nodeData.spec.direction = newNode.nodeData.spec.direction || '-z';
              if (newNode.nodeData.spec.thickness_mm == null) newNode.nodeData.spec.thickness_mm = 16;
            }
            
            // ���� ������ ��� ������, ��������� ���
            if (selectedDetailType) {
              newNode.nodeData.detailType = selectedDetailType;
              newNode.setAttribute('data-detail-type', selectedDetailType);
              
              const detailTypeInfo = detailTypes.find(dt => dt.id === selectedDetailType);
              if (detailTypeInfo) {
                newNode.nodeData.detailTypeName = detailTypeInfo.name;
                newNode.nodeData.detailOrientation = detailTypeInfo.orientation;
                newNode.nodeData.detailPosition = detailTypeInfo.position;
                    
                    // ⭐ �����������: ������������� orientation � spec �� getDetailDefaults
                    {
                      const defaults = cldGetDetailDefaults(selectedDetailType);
                      if (defaults) {
                        // ��������: orientation �������� � spec.orientation
                        if (defaults.spec?.orientation) {
                          newNode.nodeData.orientation = defaults.spec.orientation; // 'v', 'h', 'f'
                          if (!newNode.nodeData.spec) newNode.nodeData.spec = {};
                          newNode.nodeData.spec.orientation = defaults.spec.orientation;
                        }
                        // ������������� ������� � ������� �� defaults
                        if (defaults.size) newNode.nodeData.size = defaults.size;
                        if (defaults.pos) newNode.nodeData.position = defaults.pos;
                        if (defaults.pivot) newNode.nodeData.anchor = defaults.pivot;
                      }
                    }
              }
            }
            
            // ��������� �������� � ������
            const nameElement = newNode.querySelector('.tree-node-name');
            if (nameElement) {
              nameElement.textContent = elementName;
            }
            
            // ��������� � ������
            addTreeNodeToParent(newNode, parentNode);
            
            if (selectedType === 'detail' && selectedDetailType) {
            }
            
            // �������� ����� �������
            selectTreeNode(newNode);
            
                // ��������� ��������� ���� ����� ����������� 3D
            closeModal();
            
            if (selectedType === 'detail' && selectedDetailType) {
            }
            
                // ��������� 3D ������ ����� �������� �������
                setTimeout(() => {
            if (typeof window.__ppPostModuleToIframe === 'function') {
              window.__ppPostModuleToIframe();
                  } else {
                    console.warn('[CLD][detail] ⚠️ __ppPostModuleToIframe �� ����������');
                  }
                }, 100);
                
              } catch (error) {
                console.error('[CLD][modal] ❌ ������ ��� ���������� ��������:', error);
                alert('������ ��� ���������� ��������: ' + error.message);
                // ��� ����� ��������� ������� ��� ������
                closeModal();
              }
            };
          }
          
          // �������� ��� ����� ��� ���������� ����
          modal.onclick = function(e) {
            if (e.target === modal) {
              closeModal();
            }
          };
        }
        
        // ������� ��� ����� ���� ��������� ������ � JSON ������
        function getConstructorTreeJSON() {
          const rootModule = document.getElementById('constructor-root-module');
          if (!rootModule) {
            console.warn('⚠️ �������� ������ �� ������');
            return null;
          }

          try {
            const sn =
              (typeof currentSelectedNode !== 'undefined' && currentSelectedNode) ||
              window.__cldCurrentSelectedNode ||
              window.currentSelectedNode;
            if (sn && typeof saveConstructorNodeData === 'function') saveConstructorNodeData(sn);
          } catch (_) {}
          
          // ������� ��� ������������ ������ ����� ������
          function collectNodeData(nodeElement) {
            if (!nodeElement || !nodeElement.nodeData) {
              return null;
            }
            
            const nodeData = nodeElement.nodeData;
            let nodeType = nodeElement.getAttribute('data-node-type');
            if (!nodeType) {
              const ot = String(nodeData.originalType || nodeData.type || '').toLowerCase();
              nodeType =
                ot === 'detail' || ot === 'facade' || ot === 'module' || ot === 'model' || ot === 'furniture'
                  ? 'detail'
                  : 'section';
            }
            const nodeId = nodeElement.getAttribute('data-node-id');
            
            // ������� ������ ����
            const result = {
              type: nodeType || 'section',
              id: nodeId || '',
              name: nodeData.name || '',
              originalType: nodeData.originalType || nodeType,
              hide_when_filled: nodeData.hide_when_filled || false,
              active: nodeData.active !== undefined ? nodeData.active : true,
              article: nodeData.article || '',
              children: [],
              // ������������� (��� ���� ����� �����)
              accessories: Array.isArray(nodeData.accessories) ? nodeData.accessories.map(acc => ({
                id: String(acc.id || ''),
                name: String(acc.name || ''),
                sku: String(acc.sku || acc.article || ''),
                category: String(acc.category || ''),
                count: Number(acc.count || 1),
                c: Number(acc.c || 1),
                ...(typeof acc.modelUrl === 'string' && acc.modelUrl.trim() ? { modelUrl: acc.modelUrl.trim() } : {}),
                ...(typeof acc.modelUrlFacade === 'string' && acc.modelUrlFacade.trim() ? { modelUrlFacade: acc.modelUrlFacade.trim() } : {}),
                ...(typeof acc.glbUrl === 'string' && acc.glbUrl.trim() ? { glbUrl: acc.glbUrl.trim() } : {}),
                ...(typeof acc.glb === 'string' && acc.glb.trim() ? { glb: acc.glb.trim() } : {}),
                ...(typeof acc.model3d === 'string' && acc.model3d.trim() ? { model3d: acc.model3d.trim() } : {}),
                ...(Array.isArray(acc.hinges) && acc.hinges.length ? { hinges: acc.hinges.map((h) => ({ ...h })) } : {}),
                ...(Number.isFinite(Number(acc.hingeOffsetXMm)) ? { hingeOffsetXMm: Number(acc.hingeOffsetXMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeOffsetYMm)) ? { hingeOffsetYMm: Number(acc.hingeOffsetYMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeOffsetZMm)) ? { hingeOffsetZMm: Number(acc.hingeOffsetZMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeCabinetThicknessMm)) && Number(acc.hingeCabinetThicknessMm) > 0 ? { hingeCabinetThicknessMm: Number(acc.hingeCabinetThicknessMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeRotZDeg)) ? { hingeRotZDeg: Number(acc.hingeRotZDeg) } : {}),
                ...(Number.isFinite(Number(acc.hingeRotYDeg)) ? { hingeRotYDeg: Number(acc.hingeRotYDeg) } : {}),
                ...(Number.isFinite(Number(acc.hingeRotXDeg)) ? { hingeRotXDeg: Number(acc.hingeRotXDeg) } : {}),
                ...(Number.isFinite(Number(acc.hingeModelScale)) && Number(acc.hingeModelScale) > 0 ? { hingeModelScale: Number(acc.hingeModelScale) } : {}),
              })) : []
            };

            // ��� ������ (type: 'section') ����� ��������� �������/�������/������� � export,
            // ����� ��� round-trip �������� ���������� �������.
            if (nodeType === 'section') {
              result.size = nodeData.size || { x: '', y: '', z: '' };
              result.pos = nodeData.position || { x: '0', y: '0', z: '0' };
              result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
              result.rot = nodeData.rotation || { x: '0', y: '0', z: '0' };
              const lrRaw = nodeData.sectionLayoutRole ?? nodeData.layout_role;
              const lr =
                typeof window.__cldNormalizeSectionLayoutRole === 'function'
                  ? window.__cldNormalizeSectionLayoutRole(lrRaw)
                  : String(lrRaw || '').trim();
              if (lr) result.layout_role = lr;
            }
            
            // ���� ��� ������, ��������� ����������� ����
            if (nodeType === 'detail') {
              // ������������� (model/furniture): ������������ � ������� ���������
              const originalType = nodeData.originalType || '';
              if (originalType === 'model' || originalType === 'furniture') {
                result.type = originalType; // ��������� �������� ���
                result.spec = {
                  id: String(nodeData.modelId || ''),
                  key: String(nodeData.modelKey || ''),
                  ...(originalType === 'model' ? { model_mats: nodeData.modelMats || {} } : {})
                };
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.current)) result.current = nodeData.current;
                return result; // ���������� �����, �� ��������� ���� ��� ������� �������
              }
              
              // ⭐ ������: facade � Clodis � ��� ������ (�����, ������, ��� � �.�.)
              if (originalType === 'facade') {
                result.type = 'facade'; // ��������� �������� ���
                // ������ ����� spec.id (ID ������ �� ����������) � spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                // ��������: ����� �� ��������� �� ������ ����� (pos.z = 0); �� �������� � pos.z = @section.depth
                result.pos = nodeData.position && (nodeData.position.z !== undefined && nodeData.position.z !== '') ? nodeData.position : { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor && (nodeData.anchor.z !== undefined) ? nodeData.anchor : { x: -1, y: -1, z: 1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                // ��������: ������ = ������ � ������ ������, ������� 16��
                result.size = nodeData.size && (nodeData.size.x || nodeData.size.y) ? nodeData.size : { x: '@section.width', y: '@section.height', z: 16 };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // ���������� �����, �� ��������� ���� ��� ������� �������
              }
              
              // ⭐ ������: module � Clodis � ��� ������� �������� (�����, ����� � �.�.)
              if (originalType === 'module') {
                result.type = 'module'; // ��������� �������� ���
                // ������ ����� spec.id (ID ������ �� ����������) � spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // ���������� �����, �� ��������� ���� ��� ������� �������
              }
              
              // ⭐ ������: facade � Clodis � ��� ������ (�����, ������, ��� � �.�.)
              if (originalType === 'facade') {
                result.type = 'facade'; // ��������� �������� ���
                // ������ ����� spec.id (ID ������ �� ����������) � spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                // ��������: ����� �� ��������� �� ������ ����� (pos.z = 0); �� �������� � pos.z = @section.depth
                result.pos = nodeData.position && (nodeData.position.z !== undefined && nodeData.position.z !== '') ? nodeData.position : { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor && (nodeData.anchor.z !== undefined) ? nodeData.anchor : { x: -1, y: -1, z: 1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                // ��������: ������ = ������ � ������ ������, ������� 16��
                result.size = nodeData.size && (nodeData.size.x || nodeData.size.y) ? nodeData.size : { x: '@section.width', y: '@section.height', z: 16 };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // ���������� �����, �� ��������� ���� ��� ������� �������
              }
              
              // ⭐ ������: module � Clodis � ��� ������� �������� (�����, ����� � �.�.)
              if (originalType === 'module') {
                result.type = 'module'; // ��������� �������� ���
                // ������ ����� spec.id (ID ������ �� ����������) � spec.element_type
                result.spec = nodeData.spec || {};
                if (nodeData.modelId) {
                  result.spec.id = String(nodeData.modelId);
                }
                if (nodeData.modelKey) {
                  result.spec.key = String(nodeData.modelKey);
                }
                result.pos = nodeData.position || { x: 0, y: 0, z: 0 };
                result.pivot = nodeData.anchor || { x: -1, y: -1, z: -1 };
                result.rot = nodeData.rotation || { x: 0, y: 0, z: 0 };
                result.c_rot = nodeData.c_rot || { x: 0, y: 0, z: 0 };
                result.size = nodeData.size || { x: '', y: '', z: '' };
                result.events = nodeData.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
                result.visible = nodeData.visible !== undefined ? (nodeData.visible ? 1 : 0) : 1;
                result.active = nodeData.active !== undefined ? (nodeData.active ? 1 : 0) : 1;
                if (Array.isArray(nodeData.accessories)) result.accessories = nodeData.accessories;
                return result; // ���������� �����, �� ��������� ���� ��� ������� �������
              }
              
              // ������� ������ (wall).
              // �����: ��� ����������� round‑trip � ����� �� �������� spec/size/pos/pivot:
              // ��, ��� ������ �� JSON (templateItemToNodeData), ��������� ������� ��� ����.
              const detailTypeId = nodeData.detailType || nodeData.detailTypeId;
              let defaultPivot = null;
              if (detailTypeId) {
                const dflt = cldGetDetailDefaults(detailTypeId);
                defaultPivot = dflt?.pivot || null;
              }

              // �������� ���� ������
              result.type = 'wall';
              result.size = nodeData.size || { x: '', y: '', z: '' };
              result.position = nodeData.position || { x: '0', y: '0', z: '0' };
              // ���� anchor �� ����� � ���������� ��������� pivot �� ���� ������ (��� � ���������)
              result.anchor = nodeData.anchor ?? defaultPivot ?? { x: 0, y: 0, z: 0 };
              result.rotation = nodeData.rotation || { x: '0', y: '0', z: '0' };
              result.comments = nodeData.comments || '';
              result.events = nodeData.events || {
                on_before_params: '',
                on_before_build: '',
                on_after_build: '',
                on_drag_end: ''
              };
              result.fill_key = nodeData.fill_key || '';
              result.consider_size = nodeData.consider_size || false;
              result.consider_cuts = nodeData.consider_cuts || false;
              result.consider_intersections = nodeData.consider_intersections || false;

              // ������������ ������ (����������, ��������, ������ � �.�.) ������ ������ spec,
              // ����� ��������� ��������� � ����������� JSON.
              // ���� nodeData.spec ��� ���� (�������� �� JSON) � ������ ���������� ���.
              // ������� ���� orientation/material/edges ��������� ������ ��� ����� (��� UI),
              // �� �� ���������� �� ��� ����� spec.
              if (nodeData.spec && typeof nodeData.spec === 'object') {
                result.spec = nodeData.spec;
              }
            }
            
            // �������� �������� ��������
            const childrenContainer = nodeElement.querySelector('.tree-node-children');
            if (childrenContainer) {
              const childNodes = childrenContainer.querySelectorAll('.constructor-tree-node');
              childNodes.forEach(childNode => {
                const childData = collectNodeData(childNode);
                if (childData) {
                  result.children.push(childData);
                }
              });
            }
            
            return result;
          }
          
          // �������� ������ ��������� ������
          const rootData = {
            type: 'module',
            name: (() => {
              const el = document.getElementById('constructor-root-module-name');
              if (el?.textContent && String(el.textContent).trim()) return String(el.textContent).trim();
              const inp = document.getElementById('catalog-item-edit-name');
              if (inp?.value && String(inp.value).trim()) return String(inp.value).trim();
              return '(������ ��� ��������)';
            })(),
            children: [],
            // ���������� ������ (������� "����������")
            variables: (() => {
              const nd = rootModule.nodeData || {};
              // �����������, ��� main ���������� �� enabled vars
              if (nd.variables && typeof nd.variables === 'object') {
                if (Array.isArray(nd.variables.groups)) {
                  const flat = {};
                  for (const g of (nd.variables.groups || [])) {
                    if (!g || g.enabled === false) continue;
                    for (const v of (g.vars || [])) {
                      if (!v || v.enabled === false) continue;
                      const key = String(v.key || '').trim();
                      if (!key || key === '_wt') continue;
                      const n = Number(v.value);
                      if (!Number.isFinite(n)) continue;
                      flat[key] = n;
                    }
                  }
                  nd.variables.main = flat;
                }
              }
              const main = (nd.variables && typeof nd.variables === 'object' && nd.variables.main && typeof nd.variables.main === 'object')
                ? nd.variables.main
                : {};
              // ��������� ��� plain object key->number
              const out = {};
              for (const [k, v] of Object.entries(main || {})) {
                const key = String(k || '').trim();
                const n = Number(v);
                if (!key || !Number.isFinite(n)) continue;
                out[key] = n;
              }
              // ����� ��������� groups ��� UI
              const groups = Array.isArray(nd.variables?.groups) ? nd.variables.groups : [];
              return { main: out, groups };
            })(),
            // ����� ������ ������ ��� 3D (clean-room): template.structure
            // �� ������ legacy, ������ ��� ���� (UI) ��-�������� ����������� � children.
            template: { structure: [] }
          };

          // ������� (clean-room): ��������� ����������� ��������� ���������
          try {
            const nd = rootModule.nodeData || {};
            const templates = Array.isArray(nd.templates) ? nd.templates : [];
            if (templates.length) {
              rootData.templates = templates.map((t) => ({
                id: t.id,
                name: t.name,
                article: t.article,
                min: t.min,
                max: t.max,
                accessories: t.accessories,
                constructor_structure: t.constructor_structure,
              }));
              rootData.selectedTemplateId = nd.selectedTemplateId || templates?.[0]?.id || null;
            }
          } catch {}

          // ���������: overrides ����� (�������/��������) � ��������� ������ � ���������
          try {
            const nd = rootModule.nodeData || {};
            const ov = nd.materials_overrides || (window.__cldMaterialsState?.groupOverrides || null);
            if (ov && typeof ov === 'object') {
              rootData.materials_overrides = JSON.parse(JSON.stringify(ov));
            }
          } catch {}
          // ���������: ������ ����� ���������� ������ (��� � ��������� "������ ����������")
          try {
            const nd = rootModule.nodeData || {};
            if (Array.isArray(nd.material_groups)) {
              rootData.material_groups = JSON.parse(JSON.stringify(nd.material_groups));
            }
          } catch {}
          
          // �������� �������� �������� ��������� ������
          const childrenContainer = document.getElementById('constructor-root-module-children');
          if (childrenContainer) {
            const childNodes = childrenContainer.querySelectorAll('.constructor-tree-node');
            childNodes.forEach(childNode => {
              const childData = collectNodeData(childNode);
              if (childData) {
                rootData.children.push(childData);
              }
            });

            // ������� JSON � ���������� ������� template.structure (������ section/wall ��� 3D).
            // ��� ����� ����� ���������� ������/������ JSON ������� [].
            if (typeof __ppBuildClodisTemplateTreeFromDom === 'function') {
              rootData.template.structure = __ppBuildClodisTemplateTreeFromDom(childrenContainer);
              rootData.spec = rootData.spec || {};
              rootData.spec.template = rootData.spec.template || {};
              rootData.spec.template.tree = rootData.template.structure;
              if (rootData.template.structure.length > 0) {
                rootModule.nodeData = rootModule.nodeData || {};
                rootModule.nodeData.clodisJSON = rootData.template.structure;
                console.log('[�����������] getConstructorTreeJSON: ������ �� DOM → template.structure, �����:', rootData.template.structure.length);
              }
            }
          }
          
          return rootData;
        }
        
        // ������� ��� �������������� ������ �� JSON
        function loadConstructorTreeFromJSON(jsonData) {
          // UX fix: ��� ��������� �����/���������� �� iframe �������� ����-Place JSON,
          // � ������� DOM-���� ������������. �� ������ ������������ ���������,
          // ����� ������ ������� "��������" (��������� � root/empty).
          const prevSelectedId = currentSelectedNode?.getAttribute?.('data-node-id')
            || currentSelectedNode?.nodeData?.id
            || '';
          const prevSelectedPath = (() => {
            try {
              if (typeof getNodePath === 'function') return getNodePath(currentSelectedNode);
              const ds = currentSelectedNode?.dataset?.cldPath;
              return ds || '';
            } catch {
              return '';
            }
          })();

          if (!jsonData) {
            console.warn('⚠️ ��� ������ ��� �������� ������');
            return;
          }

          // ������������� � �������� ���������: ���� ������ ������ [section, ...] � ����������� � ������
          if (Array.isArray(jsonData)) {
            jsonData = { template: { structure: jsonData } };
          }

          // �������������: ���� legacy children �����������, �� ���� template.structure � ��������������� UI ������ �� ����.
          // �������� ����� ����� ���� ������ { type: "section", children: [ wall, facade, ... ] } � �� ������ ������.
          const hasLegacyChildren = Array.isArray(jsonData.children);
          let hasNewStructure = Array.isArray(jsonData.template?.structure);

          // FIX: ��������� ������ ���������� �������� � template.structure ������ ����
          // [ section{children:[...]}, wall, wall, facade, ... ].
          // ��� ����� JSON ��� �������� ������ ����������� � ������.
          // ���� ������ ������� � ������ � children, � ������ ���� ������� ������,
          // �������, ��� "��������" ������ � ������ ��� ������.
          if (!hasLegacyChildren && hasNewStructure) {
            const arr = jsonData.template.structure;
            if (Array.isArray(arr) && arr.length > 1 && arr[0]?.type === 'section' && Array.isArray(arr[0].children) && arr[0].children.length > 0) {
              jsonData.template.structure = [arr[0]];
            }
            hasNewStructure = Array.isArray(jsonData.template?.structure);
          }

          const isBareSection = !hasNewStructure && jsonData.type === 'section' && hasLegacyChildren
            && !jsonData.template && !jsonData.variables;
          const sourceChildren = isBareSection
            ? [ jsonData ]
            : (hasLegacyChildren
              ? jsonData.children
              : (hasNewStructure ? jsonData.template.structure : null));

          if (!sourceChildren || sourceChildren.length === 0) {
            console.warn('⚠️ ��� ������ ��� �������� ������ (��� �� children, �� template.structure)');
            return;
          }
          
          // ������� ������������ ������ (����� ��������� ������)
          const childrenContainer = document.getElementById('constructor-root-module-children');
          if (childrenContainer) {
            childrenContainer.innerHTML = '';
          }
          
          // ����������� �������� template.structure � UI-���� (��� ������ ��� legacy children)
          function templateItemToNodeData(item) {
            if (!item || typeof item !== 'object') return null;
            const t = String(item.type || '').toLowerCase();
            const name = item.name || (t === 'wall' ? '������' : t === 'facade' ? '�����' : t === 'module' ? '������' : t === 'model' ? '������' : t === 'furniture' ? '���������' : '������');
            
            // ������ �� ��������� (�����, �����, ���, ��������): � ���� � ������ ������������ ������, � ��� � ��� ������ � originalType 'module'
            if (t === 'module') {
              // ��������� ������� ��� ���� �� JSON (����� ���� ���������, ����� ��� undefined)
              const size = item.size ? {
                x: item.size.x !== undefined && item.size.x !== null ? item.size.x : '',
                y: item.size.y !== undefined && item.size.y !== null ? item.size.y : '',
                z: item.size.z !== undefined && item.size.z !== null ? item.size.z : ''
              } : { x: '', y: '', z: '' };
              
              // ��������� ������� ��� ���� �� JSON (����� ���� ���������, ����� ��� 0)
              const position = item.pos ? {
                x: item.pos.x !== undefined && item.pos.x !== null ? item.pos.x : 0,
                y: item.pos.y !== undefined && item.pos.y !== null ? item.pos.y : 0,
                z: item.pos.z !== undefined && item.pos.z !== null ? item.pos.z : 0
              } : { x: 0, y: 0, z: 0 };
              
              const moduleNodeData = {
                type: 'detail',
                name,
                originalType: 'module',
                size,
                position,
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                c_rot: item.c_rot || { x: '0', y: '0', z: '0' },
                // �������
                events: item.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                },
                // �������������
                accessories: Array.isArray(item.accessories) ? item.accessories : [],
                // ������ ���� �� ���������
                spec: item.spec || {},
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
                modelId: item.spec?.id ? String(item.spec.id) : '',
                modelKey: item.spec?.key || '',
              };
              
              console.log('[CLD][JSON→UI] ������ �������� �� JSON:', name, {
                originalType: 'module',
                // ⭐ �����: ���������� ��� ������ ������ �� JSON ���������
                json_size: item.size,
                json_pos: item.pos,
                json_pivot: item.pivot,
                json_spec: item.spec,
                // ��� �� ���������
                saved_size: size,
                saved_position: position,
                saved_anchor: moduleNodeData.anchor
              });
              
              return moduleNodeData;
            }
            
            // ����� �� ���������: ��������� pos/spec/pivot ��� ����, ����� � ������ �� ��������
            if (t === 'facade') {
              // �������� �� spec.material (������ ���������) + ������ ���� (��� UI)
              const specMat = item.spec?.material || {};
              const material_id = specMat.id ? String(specMat.id) : (item.material_id || '');
              const material_key = specMat.key || item.material_key || '';
              const material_group = specMat.group || item.material_group || '';
              return {
                type: 'detail',
                name,
                originalType: 'facade',
                size: item.size || { x: '', y: '', z: '' },
                position: item.pos || { x: 0, y: 0, z: 0 },
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                c_rot: item.c_rot || { x: '0', y: '0', z: '0' },
                spec: item.spec || {},
                // �������� (����� ����� ������/������ ��� ������ �� ����������� ������� � g0 ��� clodisJSONReady)
                material_id,
                material_key,
                material_group,
                material: specMat || item.material || {},
                material_icon: item.material_icon || item.materialIcon || '',
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
                modelId: item.spec?.id ? String(item.spec.id) : '',
              };
            }
            
            // �������������: model � furniture � ��� 3D ������ �� ���������� (����������� �� spec.id)
            if (t === 'model' || t === 'furniture') {
              return {
                type: 'detail', // � UI ��� ������������ ��� ������
                name,
                originalType: t, // ��������� �������� ��� ��� ��������
                // spec.id � ��� ID ������ � ���������� (����� ��������� �� ���������� �������)
                modelId: item.spec?.id || item.spec?.key || '',
                modelKey: item.spec?.key || '',
                modelMats: item.spec?.model_mats || {},
                // ������� � ������� ��������������
                size: item.size || { x: '', y: '', z: '' },
                position: item.pos || { x: '0', y: '0', z: '0' },
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                c_rot: item.c_rot || { x: '0', y: '0', z: '0' },
                // �������
                events: item.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                },
                // ������ ���� �� ��������� (��������� ��� �������������)
                spec: item.spec || {},
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
                current: Array.isArray(item.current) ? item.current : [],
              };
            }
            
            if (t === 'wall') {
              // �������� �� spec.material (������ ���������)
              const specMat = item.spec?.material || {};
              const material_id = specMat.id ? String(specMat.id) : (item.material_id || '');
              const material_key = specMat.key || item.material_key || '';
              const material_group = specMat.group || item.material_group || '';
              
              return {
                type: 'detail',
                name,
                // ��������� ������������ �������� ���� ��� UI
                detailType: item.spec?.detailTypeId || '',
                orientation: item.spec?.orientation || 'h',
                fill_key: item.spec?.side || item.spec?.key || '',
                // ��������� �������� ��������� ����, ����� �� �������� ������ ��� ����������� ����������
                size: item.size || { x: '', y: '', z: '' },
                position: item.pos || { x: '0', y: '0', z: '0' },
                anchor: item.pivot || { x: -1, y: -1, z: -1 },
                rotation: item.rot || { x: '0', y: '0', z: '0' },
                edges: item.edges || {},
                // �������� (�� spec.material ��� ������ ����)
                material_id,
                material_key,
                material_group,
                material: specMat || item.material || {},
                // �������
                events: item.events || {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                },
                // �������������
                accessories: Array.isArray(item.accessories) ? item.accessories : [],
                // ������ ���� �� ��������� (��������� ��� �������������)
                spec: item.spec || {},
                visible: item.visible !== undefined ? !!item.visible : true,
                active: item.active !== undefined ? !!item.active : true,
              };
            }
            // section/module/������ �������� ��� ������ � UI
            return {
              type: 'section',
              name,
              active: item.active !== undefined ? !!item.active : true,
              visible: item.visible !== undefined ? !!item.visible : true,
              // �����: section � Clodis � ��� ���������, ��� ����� size/pos/pivot/rot,
              // ����� ����� reload �������� "�������" � ���� � ��������� ������.
              size: item.size || { x: '', y: '', z: '' },
              position: item.pos || item.position || { x: '0', y: '0', z: '0' },
              anchor: item.pivot || item.anchor || { x: -1, y: -1, z: -1 },
              rotation: item.rot || item.rotation || { x: '0', y: '0', z: '0' },
              sectionLayoutRole:
                typeof window.__cldNormalizeSectionLayoutRole === 'function'
                  ? window.__cldNormalizeSectionLayoutRole(item.layout_role ?? item.sectionLayoutRole)
                  : String(item.layout_role ?? item.sectionLayoutRole ?? '').trim(),
              children: Array.isArray(item.children) ? item.children.map(templateItemToNodeData).filter(Boolean) : [],
            };
          }

          // ������� ��� ������������ �������� �����
          function createNodeFromData(nodeData, parentNode) {
            if (!nodeData) return null;
            
            // ���������� ��� ����
            const nodeType = nodeData.type === 'detail' ? 'detail' : 'section';
            
            // ������� ����
            const newNode = createConstructorTreeNode(nodeType, parentNode);
            
            // ������������� ������
            if (nodeData.id) {
              newNode.setAttribute('data-node-id', nodeData.id);
            }
            if (nodeData.name) {
              newNode.setAttribute('data-node-name', nodeData.name);
              newNode.nodeData.name = nodeData.name;
              
              // ��������� �������� � ������
              const nameElement = newNode.querySelector('.tree-node-name');
              if (nameElement) {
                nameElement.textContent = nodeData.name;
              }
            }
            
            // ��������� ������� ��������
            newNode.nodeData.hide_when_filled = nodeData.hide_when_filled || false;
            newNode.nodeData.active = nodeData.active !== undefined ? nodeData.active : true;
            newNode.nodeData.article = nodeData.article || '';
            newNode.nodeData.originalType = nodeData.originalType || nodeData.type;
            if (nodeData.originalType) {
              newNode.setAttribute('data-original-type', nodeData.originalType);
              // �������� ��������� originalType ��� �������
              if (nodeData.originalType === 'module') {
                console.log('[CLD][UI] ���� ������ � originalType=module:', nodeData.name, {
                  nodeType,
                  originalType: newNode.nodeData.originalType,
                  hasAttribute: newNode.hasAttribute('data-original-type'),
                  attributeValue: newNode.getAttribute('data-original-type')
                });
              }
            }
            // ������������� (��� ���� ����� �����)
            if (Array.isArray(nodeData.accessories)) {
              newNode.nodeData.accessories = nodeData.accessories.map(acc => ({
                id: String(acc.id || ''),
                name: String(acc.name || ''),
                sku: String(acc.sku || acc.article || ''),
                category: String(acc.category || ''),
                count: Number(acc.count || 1),
                c: Number(acc.c || 1),
                ...(typeof acc.modelUrl === 'string' && acc.modelUrl.trim() ? { modelUrl: acc.modelUrl.trim() } : {}),
                ...(typeof acc.modelUrlFacade === 'string' && acc.modelUrlFacade.trim() ? { modelUrlFacade: acc.modelUrlFacade.trim() } : {}),
                ...(typeof acc.glbUrl === 'string' && acc.glbUrl.trim() ? { glbUrl: acc.glbUrl.trim() } : {}),
                ...(typeof acc.glb === 'string' && acc.glb.trim() ? { glb: acc.glb.trim() } : {}),
                ...(typeof acc.model3d === 'string' && acc.model3d.trim() ? { model3d: acc.model3d.trim() } : {}),
                ...(Array.isArray(acc.hinges) && acc.hinges.length ? { hinges: acc.hinges.map((h) => ({ ...h })) } : {}),
                ...(Number.isFinite(Number(acc.hingeOffsetXMm)) ? { hingeOffsetXMm: Number(acc.hingeOffsetXMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeOffsetYMm)) ? { hingeOffsetYMm: Number(acc.hingeOffsetYMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeOffsetZMm)) ? { hingeOffsetZMm: Number(acc.hingeOffsetZMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeCabinetThicknessMm)) && Number(acc.hingeCabinetThicknessMm) > 0 ? { hingeCabinetThicknessMm: Number(acc.hingeCabinetThicknessMm) } : {}),
                ...(Number.isFinite(Number(acc.hingeRotZDeg)) ? { hingeRotZDeg: Number(acc.hingeRotZDeg) } : {}),
                ...(Number.isFinite(Number(acc.hingeRotYDeg)) ? { hingeRotYDeg: Number(acc.hingeRotYDeg) } : {}),
                ...(Number.isFinite(Number(acc.hingeRotXDeg)) ? { hingeRotXDeg: Number(acc.hingeRotXDeg) } : {}),
                ...(Number.isFinite(Number(acc.hingeModelScale)) && Number(acc.hingeModelScale) > 0 ? { hingeModelScale: Number(acc.hingeModelScale) } : {}),
              }));
            } else {
              newNode.nodeData.accessories = [];
            }
            
            // ���� ��� ������, ��������� ����������� ����
            if (nodeType === 'detail' && nodeData) {
              newNode.nodeData.orientation = nodeData.orientation || 'h';
              newNode.nodeData.shape = nodeData.shape || 'normal';
              newNode.nodeData.material = nodeData.material || {};
              newNode.nodeData.rotate = nodeData.rotate || false;
              newNode.nodeData.fixed = nodeData.fixed || false;
              // Копируем edges по значению, иначе несколько деталей делят один объект
              newNode.nodeData.edges = JSON.parse(JSON.stringify(nodeData.edges || {}));
              // ��������� ������� ��� ���� �� JSON (����� ���� ���������, ����� ��� undefined)
              newNode.nodeData.size = nodeData.size ? {
                x: nodeData.size.x !== undefined ? nodeData.size.x : '',
                y: nodeData.size.y !== undefined ? nodeData.size.y : '',
                z: nodeData.size.z !== undefined ? nodeData.size.z : ''
              } : { x: '', y: '', z: '' };
              newNode.nodeData.position = nodeData.position || { x: '0', y: '0', z: '0' };
              newNode.nodeData.anchor = nodeData.anchor || { x: 0, y: 0, z: 0 };
              newNode.nodeData.rotation = nodeData.rotation || { x: '0', y: '0', z: '0' };
              if (nodeData.c_rot && typeof nodeData.c_rot === 'object') {
                newNode.nodeData.c_rot = {
                  x: nodeData.c_rot.x || '0',
                  y: nodeData.c_rot.y || '0',
                  z: nodeData.c_rot.z || '0',
                };
              }
              newNode.nodeData.comments = nodeData.comments || '';
              // �������: ���� ������ �� ���������, ���������� ��, ����� ������
              if (nodeData.events && typeof nodeData.events === 'object') {
                newNode.nodeData.events = {
                  on_before_params: nodeData.events.on_before_params || '',
                  on_before_build: nodeData.events.on_before_build || '',
                  on_after_build: nodeData.events.on_after_build || '',
                  on_drag_end: nodeData.events.on_drag_end || ''
                };
              } else {
                newNode.nodeData.events = {
                  on_before_params: '',
                  on_before_build: '',
                  on_after_build: '',
                  on_drag_end: ''
                };
              }
              newNode.nodeData.fill_key = nodeData.fill_key || '';
              newNode.nodeData.consider_size = nodeData.consider_size || false;
              newNode.nodeData.consider_cuts = nodeData.consider_cuts || false;
              newNode.nodeData.consider_intersections = nodeData.consider_intersections || false;

              // ���. ���� ������������� (���� ������ �� template.structure ��� ���������)
              if (nodeData.detailType) newNode.nodeData.detailType = nodeData.detailType;
              // ������������� ��� ��������� ���� ��� ���� ����� �����
              if (nodeData.material_id) newNode.nodeData.material_id = nodeData.material_id;
              if (nodeData.material_key) newNode.nodeData.material_key = nodeData.material_key;
              if (nodeData.material_group) newNode.nodeData.material_group = nodeData.material_group;
              if (nodeData.material && typeof nodeData.material === 'object') newNode.nodeData.material = nodeData.material;
              if (nodeData.spec && typeof nodeData.spec === 'object') newNode.nodeData.spec = nodeData.spec;
              if (nodeData.visible !== undefined) newNode.nodeData.visible = !!nodeData.visible;
              // ������������� (model/furniture/module): ��������� originalType � ��������� ����
              if (nodeData.originalType === 'model' || nodeData.originalType === 'furniture' || nodeData.originalType === 'module') {
                newNode.nodeData.originalType = nodeData.originalType;
                newNode.setAttribute('data-original-type', nodeData.originalType); // ������������� ������� ��� CSS (������ ����� ��� �������)
                if (nodeData.modelId) newNode.nodeData.modelId = String(nodeData.modelId);
                if (nodeData.modelKey) newNode.nodeData.modelKey = String(nodeData.modelKey);
                if (nodeData.modelMats && typeof nodeData.modelMats === 'object') newNode.nodeData.modelMats = nodeData.modelMats;
                if (Array.isArray(nodeData.current)) newNode.nodeData.current = nodeData.current;
                // ��� ������� ��������� c_rot (�������������� �������)
                if (nodeData.originalType === 'module' && nodeData.c_rot && typeof nodeData.c_rot === 'object') {
                  newNode.nodeData.c_rot = {
                    x: nodeData.c_rot.x || '0',
                    y: nodeData.c_rot.y || '0',
                    z: nodeData.c_rot.z || '0'
                  };
                } else if (nodeData.c_rot && typeof nodeData.c_rot === 'object') {
                  newNode.nodeData.c_rot = nodeData.c_rot;
                }
              }
            }

            // ��������� ������������ section ���� (size/pos/anchor/rotation),
            // ����� properties panel �� ��������� ������ �������� ��� ���������� �� JSON.
            if (nodeType === 'section' && nodeData) {
              newNode.nodeData.size = nodeData.size ? {
                x: nodeData.size.x !== undefined ? nodeData.size.x : '',
                y: nodeData.size.y !== undefined ? nodeData.size.y : '',
                z: nodeData.size.z !== undefined ? nodeData.size.z : '',
              } : { x: '', y: '', z: '' };

              newNode.nodeData.position = nodeData.position || nodeData.pos || { x: '0', y: '0', z: '0' };
              newNode.nodeData.anchor = nodeData.anchor || nodeData.pivot || { x: -1, y: -1, z: -1 };
              newNode.nodeData.rotation = nodeData.rotation || nodeData.rot || { x: '0', y: '0', z: '0' };
              const lr0 = nodeData.sectionLayoutRole ?? nodeData.layout_role;
              newNode.nodeData.sectionLayoutRole =
                typeof window.__cldNormalizeSectionLayoutRole === 'function'
                  ? window.__cldNormalizeSectionLayoutRole(lr0)
                  : String(lr0 || '').trim();
            }
            
            // ��������� ���� � ������
            addTreeNodeToParent(newNode, parentNode);
        // ��������� ������ � iframe ��� ������ ����������
        if (typeof window.__ppPostModuleToIframe === 'function') {
          window.__ppPostModuleToIframe();
        }
            
            // ���������� ������� �������� ��������
            if (nodeData.children && Array.isArray(nodeData.children)) {
              nodeData.children.forEach(childData => {
                createNodeFromData(childData, newNode);
              });
            }
            
            return newNode;
          }
          
          // ������� ���� �� ������
          const rootModule = document.getElementById('constructor-root-module');
          // ��������������� �������� �������� ������ (��� + ����������)
          if (rootModule) {
            rootModule.nodeData = rootModule.nodeData || {};
            // ��� ������ � ����� ������: �� ��������� ������ DOM (�������� ������) ���� jsonData.name ��� �
            // �������� ������: constructor_structure = ������ [ { section cabinet_root� } ]
            {
              const nameEl = document.getElementById('constructor-root-module-name');
              const catalogNameInput = document.getElementById('catalog-item-edit-name');
              const fromJson = jsonData.name != null && String(jsonData.name).trim();
              const fromCatalog =
                catalogNameInput && String(catalogNameInput.value || '').trim();
              let fromFirstSection = '';
              if (Array.isArray(sourceChildren) && sourceChildren.length > 0) {
                const n0 = sourceChildren[0]?.name;
                if (n0 != null && String(n0).trim()) fromFirstSection = String(n0).trim();
              }
              const rootLabel = fromJson || fromCatalog || fromFirstSection;
              if (rootLabel) {
                rootModule.nodeData.name = rootLabel;
                if (nameEl) nameEl.textContent = rootLabel;
              }
            }
            if (jsonData.variables && typeof jsonData.variables === 'object') {
              const main = (jsonData.variables.main && typeof jsonData.variables.main === 'object') ? jsonData.variables.main : {};
              const groups = Array.isArray(jsonData.variables.groups) ? jsonData.variables.groups : null;
              if (groups) {
                rootModule.nodeData.variables = { groups: groups.map((g) => ({
                  id: g.id || ('grp_' + Math.random().toString(36).slice(2)),
                  name: g.name || '������',
                  enabled: g.enabled !== false,
                  collapsed: !!g.collapsed,
                  vars: Array.isArray(g.vars) ? g.vars.map((v) => ({
                    id: v.id || ('var_' + Math.random().toString(36).slice(2)),
                    key: String(v.key || '').trim(),
                    value: Number(v.value),
                    enabled: v.enabled !== false,
                    scope: v.scope || 'module',
                  })) : [],
                })) };
              } else {
                rootModule.nodeData.variables = { main: { ...(main || {}) } };
              }
            } else if (rootModule.nodeData.variables == null) {
              rootModule.nodeData.variables = { groups: [] };
            }

            // �������: �������������� ������, ���� ������ �� JSON
            if (Array.isArray(jsonData.templates)) {
              rootModule.nodeData.templates = jsonData.templates.map((t) => ({
                id: t.id || ('tpl_' + Math.random().toString(36).slice(2)),
                name: t.name || '',
                article: t.article || '',
                min: (t.min && typeof t.min === 'object') ? t.min : { w: 0, h: 0, d: 0 },
                max: (t.max && typeof t.max === 'object') ? t.max : { w: 0, h: 0, d: 0 },
                accessories: Array.isArray(t.accessories) ? t.accessories : [],
                constructor_structure: t.constructor_structure || {},
              }));
              rootModule.nodeData.selectedTemplateId = jsonData.selectedTemplateId || rootModule.nodeData.templates?.[0]?.id || null;
            }

            // ���������: �������������� overrides
            if (jsonData.materials_overrides && typeof jsonData.materials_overrides === 'object') {
              rootModule.nodeData.materials_overrides = jsonData.materials_overrides;
              try {
                window.__cldMaterialsState = window.__cldMaterialsState || { groupOverrides: {} };
                window.__cldMaterialsState.groupOverrides = { ...(jsonData.materials_overrides || {}) };
              } catch {}
            }

            if (Array.isArray(jsonData.material_groups)) {
              rootModule.nodeData.material_groups = jsonData.material_groups;
            }
          }
          // ������ ������������ ����� templateItemToNodeData: � legacy (children), � template.structure.
          // ����� type: "facade" �� ��������� �� ������������ � detail+originalType facade � ������ ���������.
          const childrenForLoad = sourceChildren.map(templateItemToNodeData).filter(Boolean);
          
          // �������� ����������� ������ ��� �������
          const loadedModules = childrenForLoad.filter(c => c.originalType === 'module');
          if (loadedModules.length > 0) {
            console.log('[CLD][JSON→UI] ��������� ������� �� JSON:', loadedModules.length, loadedModules.map(m => ({
              name: m.name,
              originalType: m.originalType,
              size: m.size,
              position: m.position,
              anchor: m.anchor
            })));
          }

          childrenForLoad.forEach(childData => {
            createNodeFromData(childData, rootModule);
          });
          
          if (typeof syncTreePaths === 'function') syncTreePaths();
          
          // ��������� ������ ����� �������� ����� ������ (������, ������ ������ ���������)
          if (typeof window.__ppPostModuleToIframe === 'function') {
            window.__ppPostModuleToIframe();
          }

          // ��������������� ��������� (������ �������) �� ��� �� ���� �� id
          if (prevSelectedId || prevSelectedPath) {
            setTimeout(() => {
              try {
                // 1) �������������� �� dataset.cldPath (����� ����������)
                if (prevSelectedPath) {
                  const nodes = document.querySelectorAll('.constructor-tree-node');
                  const restoredByCldPath = Array.from(nodes).find((n) => String(n.dataset?.cldPath || '') === String(prevSelectedPath));
                  if (restoredByCldPath) {
                    if (typeof selectTreeNode === 'function') selectTreeNode(restoredByCldPath);
                    else if (typeof updateConstructorPropertiesPanel === 'function') updateConstructorPropertiesPanel(restoredByCldPath);
                    return;
                  }
                }

                if (prevSelectedId) {
                  const nodes = document.querySelectorAll('.constructor-tree-node');
                  const restoredById = Array.from(nodes).find((n) => String(n.getAttribute('data-node-id')) === String(prevSelectedId));
                  if (restoredById) {
                    if (typeof selectTreeNode === 'function') selectTreeNode(restoredById);
                    else if (typeof updateConstructorPropertiesPanel === 'function') updateConstructorPropertiesPanel(restoredById);
                  }
                }
              } catch (e) {
                // ignore
              }
            }, 0);
          }
        }
        
        // ������������ ������� ��� ������������� � ������ ������
        window.getConstructorTreeJSON = getConstructorTreeJSON;
        window.loadConstructorTreeFromJSON = loadConstructorTreeFromJSON;

        // 3D ������ ����� iframe (ensureClodisPreviewMounted) �� ��������� ���������,
        // ����� �� ������ ������ ������ � �� ������� ������ ������� �������.
        // ��� ������������� ������ ����� �������� �� �������:
        //   window.ensureClodisPreviewMounted && window.ensureClodisPreviewMounted();
        //   window.__ppPostModuleToIframe && window.__ppPostModuleToIframe();

        // ������� ������������� �� ��������� �������� (��� � ��������� � � ���������)
        const wIn = document.getElementById('catalog-item-edit-width');
        const hIn = document.getElementById('catalog-item-edit-height');
        const dIn = document.getElementById('catalog-item-edit-depth');
        const key = '__cld_size_sync_attached';
        if (wIn && !wIn[key]) {
          let t = null;
          const schedule = () => {
            if (t) clearTimeout(t);
            t = setTimeout(() => {
              // ��� � ���������: ��������� ����������� (min/max) �� �������������
              try { window.__cldClampMainSizeInputs && window.__cldClampMainSizeInputs(); } catch {}
              if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
            }, 250);
          };
          wIn.addEventListener('input', schedule);
          hIn && hIn.addEventListener('input', schedule);
          dIn && dIn.addEventListener('input', schedule);
          wIn[key] = true;
        }

        // ��������: ��� �������� ������ ������� ������ (������������ ������ placeholder)
        if (typeof updateConstructorPropertiesPanel === 'function') {
          updateConstructorPropertiesPanel(rootModule);
        }

        // ��������� iframe-������ �� ��������� � ���������
        if (typeof window.ensureClodisPreviewMounted === 'function') {
          window.ensureClodisPreviewMounted();
        }
      }

      // ���������� ������, ������� ���������� ����� initConstructorTab ������ �������.
      // ������������ �� ������ ���� (�������� ��������, ����� JSON � �.�.),
      // ����� �������������� ���������������� ����������� ���� ���.
      window.__cldInitConstructorTab = function __cldInitConstructorTab() {
        try {
          if (!window.__CLD_CONSTRUCTOR_INITIALIZED && typeof initConstructorTab === 'function') {
            initConstructorTab();
          }
        } catch (e) {
          console.error('[CLD] __cldInitConstructorTab error', e);
          window.__CLD_CONSTRUCTOR_INITIALIZED = false;
        }
      };

      // ===== Clodis (��������) 3D engine: ���������� ������ ����� iframe (constructor-clodis.html) =====
      function buildClodisTemplateTreeFromDom(rootContainer) {
        // ��� iframe-������ ���������� ������ �����: ����� ���������/������ �������� �� fallback,
        // ����� ������ ��������� �� ����� �� �������� ��������� (��������, w1h1a1).
        const toNumSafe = (v, fallback) => {
          const n = Number(v);
          return Number.isFinite(n) ? n : fallback;
        };

        function nodeToParams(nodeEl, parentNode = null) {
          const nodeType = nodeEl.getAttribute('data-node-type') || 'section';
          const nodeId = nodeEl.getAttribute('data-node-id') || '';
          const nd = nodeEl.nodeData || {};

          const isSection = nodeType === 'section';
          // � ��������� ��������/������������ ������ � fill_section, ������ � wall
          const ppType = isSection ? 'fill_section' : 'wall';

          const size = nd.size || {};
          const pos = nd.position || {};
          const rot = nd.rotation || {};
          const hasAnchor = !!nd.anchor;
          const isZeroAnchor =
            hasAnchor &&
            Number(nd.anchor?.x) === 0 &&
            Number(nd.anchor?.y) === 0 &&
            Number(nd.anchor?.z) === 0;
          const useAnchor = hasAnchor && (nd.anchor_user_set || !isZeroAnchor);
          let pivot = useAnchor ? nd.anchor : { x: -1, y: -1, z: -1 };
          
          // ��� �������: ���� ��� ����� �������, ���������� ��������� �� detailType
          let detailPos = pos;
          if (!isSection && (nd.detailType || nodeEl.getAttribute('data-detail-type'))) {
            const detailTypeId = nd.detailType || nodeEl.getAttribute('data-detail-type');
            
            // ⭐ �����: ������������� ���������� pivot �� ������ detailTypeId (��� � __ppBuildClodisTemplateTreeFromDom)
            // ��: ���� ������������ ��� ����� anchor � �� ���������� ���.
            // ���� anchor ����������� ��� ��� ������ "�������" anchor ��� ����������������� ��������� �
            // ��������� ������ pivot �� ���� ������.
            if (detailTypeId && (!useAnchor)) {
              if (detailTypeId === 'vertical_left') {
                pivot = { x: -1, y: -1, z: -1 }; // ������ ����� ������� ���� ������ (��������: default pivot)
              } else if (detailTypeId === 'vertical_right') {
                pivot = { x: 1, y: -1, z: -1 };
              } else if (detailTypeId === 'vertical_middle') {
                pivot = { x: 0, y: -1, z: -1 };
              } else if (detailTypeId === 'horizontal_top') {
                pivot = { x: -1, y: 1, z: -1 };
              } else if (detailTypeId === 'horizontal_bottom') {
                pivot = { x: -1, y: -1, z: -1 };
              } else if (detailTypeId === 'horizontal_middle') {
                pivot = { x: -1, y: 0, z: -1 };
              } else if (detailTypeId === 'front_front') {
                pivot = { x: -1, y: -1, z: 1 };
              } else if (detailTypeId === 'front_middle') {
                pivot = { x: -1, y: -1, z: 0 };
              }
            }
            
            // ���� ������� �� ������ ����, ��������� �� ��������� detailType
            if (!pos.x && !pos.y && !pos.z) {
              // �������� (legacy): ��� vertical_left pos.z = s:z. � clean-room ���������� @section.depth.
              // �� ����� �� �������� � ��������� ����������, ������� ����� �������� ������� ������
              const parentSize = parentNode?.nodeData?.size || { x: 300, y: 400, z: 200 };
              const materialThickness = 16; // g:g0.thickness (������ 16��)
              
              if (detailTypeId === 'vertical_left') {
                // ⭐ �����������: ���� pivot ������ � ������ ����� ������� ����� (x=-1, y=-1, z=-1),
                // �� pos.x = 0 � pos.z = 0 (������ ������� � ������ � ������� ���� ������)
                detailPos = {
                  x: 0, // ⭐ ����������: ���� materialThickness, ������ 0
                  y: 0, // ��� ������������ ������ 0
                  z: 0  // ⭐ ����������: ���� parentSize.z, ������ 0
                };
              } else if (detailTypeId === 'vertical_right') {
                detailPos = {
                  x: parentSize.x - materialThickness, // (@section.width) - thickness
                  y: 0,
                  z: parentSize.z // @section.depth
                };
              } else if (detailTypeId === 'horizontal_top') {
                detailPos = {
                  x: materialThickness, // g:g0.thickness
                  y: parentSize.y - materialThickness, // (@section.height) - thickness
                  z: parentSize.z // @section.depth
                };
              } else if (detailTypeId === 'horizontal_bottom') {
                detailPos = {
                  x: materialThickness, // g:g0.thickness
                  y: 0,
                  z: parentSize.z // @section.depth
                };
              } else {
                // ��� ������ ����� ���������� �������� �� ���������
                detailPos = { x: 0, y: 0, z: 0 };
              }
            }
          }

          const item = {
            type: ppType,
            name: nd.name || (isSection ? '������' : '������'),
            id: nodeId || nd.id || '',
            active: nd.active === false ? 0 : 1,
            // �����: size/pos ����� ���� ����������� (@section.width � �.�.) � �� ���������� � �����,
            // ����� ���������� ����� ��������, � �������� ��������� "���������" 300/400/200.
            size: {
              x: toNumOrExpr(size.x, 300),
              y: toNumOrExpr(size.y, 400),
              z: toNumOrExpr(size.z, 200)
            },
            pos: {
              x: toNumOrExpr(detailPos.x, 0),
              y: toNumOrExpr(detailPos.y, 0),
              z: toNumOrExpr(detailPos.z, 0)
            },
            pivot: {
              x: Number.isFinite(Number(pivot.x)) ? Number(pivot.x) : -1,
              y: Number.isFinite(Number(pivot.y)) ? Number(pivot.y) : -1,
              z: Number.isFinite(Number(pivot.z)) ? Number(pivot.z) : -1
            },
            rot: {
              x: toNumOrExpr(rot.x, 0),
              y: toNumOrExpr(rot.y, 0),
              z: toNumOrExpr(rot.z, 0)
            },
            children: []
          };

          // ⭐ �����: ���� ��� ������ � ���� ��������� ��� ������, ��������� spec � detailTypeId
          if (!isSection && (nd.detailType || nodeEl.getAttribute('data-detail-type'))) {
            const detailTypeId = nd.detailType || nodeEl.getAttribute('data-detail-type');
            const detailTypeName = nd.detailTypeName || '������';
            // � iframe-������ ��������� orientation ∈ {'v','h','f'}.
            // ⭐ �����������: ��������� spec.orientation > orientation > detailOrientation
            // ��������: orientation �������� � spec.orientation
            let detailOrientationRaw = nd.spec?.orientation || nd.orientation || nd.detailOrientation || 'vertical';
            // �����������: 'vertical'/'horizontal'/'frontal' → 'v'/'h'/'f'
            const detailOrientation =
              detailOrientationRaw === 'vertical' ? 'v' :
              detailOrientationRaw === 'horizontal' ? 'h' :
              detailOrientationRaw === 'frontal' ? 'f' :
              detailOrientationRaw; // ���� ��� 'v', 'h', 'f' - ��������� ��� ����
            const detailPosition = nd.detailPosition || 'vertical-left';
            
            // � Clodis ������ ����� spec.detailTypeId ��� ����������� ���� ������
            item.spec = {
              detailTypeId: detailTypeId,
              orientation: detailOrientation,
              position: detailPosition,
              ...(nd.materialId ? { material: { key: nd.materialId } } : {})
            };
            
            // ⭐ �����: �������� ������� ������ ������������ ������
            const parentSectionSize = parentNode?.nodeData?.size || { x: 300, y: 400, z: 200 };
            const detailPosX_mm = item.pos.x;
            const detailPosY_mm = item.pos.y;
            const detailPosZ_mm = item.pos.z;
            
            // ��������� ��� ������ ������ ���� � ������ (�� ������� ���������)
            const sectionCenterX = -parentSectionSize.x / 2;
            const sectionCenterY = -parentSectionSize.y / 2;
            const sectionCenterZ = -parentSectionSize.z / 2;
            
            const detailPositionX = (sectionCenterX + detailPosX_mm) / 1000;
            const detailPositionY = (sectionCenterY + detailPosY_mm) / 1000;
            const detailPositionZ = (sectionCenterZ + detailPosZ_mm) / 1000;
            // �������� ������������ ������� ��� vertical_left
            if (detailTypeId === 'vertical_left') {
              // ⭐ ����������: ���� pivot ������ � ������ ����� ������� ����� (x=-1, y=-1, z=-1),
              // �� ������ ������ ���� ������� � ������ � ������� ���� ������
              const expectedPosX = 0; // ⭐ ����������: ���� 16 (������� ���������), ������ 0
              const expectedPosY = 0; // ��� ������������ ������ 0
              const expectedPosZ = 0; // ⭐ ����������: ���� parentSectionSize.z (�������� ����), ������ 0 (������ ����)
              
              // ���������� �������� �������
              const sectionWidth = parentSectionSize.x;
              const sectionHeight = parentSectionSize.y;
              const sectionDepth = parentSectionSize.z;
              
              const leftEdge = sectionCenterX / 1000;
              const rightEdge = (sectionCenterX + sectionWidth) / 1000;
              const bottomEdge = sectionCenterY / 1000;
              const topEdge = (sectionCenterY + sectionHeight) / 1000;
              const backEdge = sectionCenterZ / 1000;
              const frontEdge = (sectionCenterZ + sectionDepth) / 1000;
              // ��������: ���� ������ �� �� ����� ����, ��� ������
              if (detailPosX_mm !== expectedPosX) {
                console.error('[CLD][detail] ❌ ������: ������ �� �� ����� ����!', {
                  expected: `${expectedPosX}mm �� ������ ���� (������� � ������ ����)`,
                  actual: `${detailPosX_mm}mm �� ������ ����`,
                  difference: `${Math.abs(detailPosX_mm - expectedPosX)}mm`
                });
              }
              
              // ��������: ���� ������ �� �� ������ ����, ��� ������
              if (detailPosZ_mm !== expectedPosZ) {
                console.error('[CLD][detail] ❌ ������: ������ �� �� ������ ����!', {
                  expected: `${expectedPosZ}mm �� ������� ���� (������� � ������� ����)`,
                  actual: `${detailPosZ_mm}mm �� ������� ����`,
                  difference: `${Math.abs(detailPosZ_mm - expectedPosZ)}mm`
                });
              }
            }
          }

          if (isSection) {
            const childrenContainer = nodeEl.querySelector(':scope > .tree-node-children');
            if (childrenContainer) {
              const directChildren = Array.from(childrenContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
              directChildren.forEach(childEl => item.children.push(nodeToParams(childEl, nodeEl)));
            }
          }

          return item;
        }

        const nodes = Array.from(rootContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
        return nodes.map(nodeEl => nodeToParams(nodeEl, null));
      }

      function buildClodisModuleParamsFromUI() {
        const widthInput = document.getElementById('catalog-item-edit-width');
        const heightInput = document.getElementById('catalog-item-edit-height');
        const depthInput = document.getElementById('catalog-item-edit-depth');

        const w = widthInput ? Number(widthInput.value) || 300 : 300;
        const h = heightInput ? Number(heightInput.value) || 400 : 400;
        const d = depthInput ? Number(depthInput.value) || 200 : 200;

        const childrenRoot = document.getElementById('constructor-root-module-children');
        let tree = childrenRoot ? buildClodisTemplateTreeFromDom(childrenRoot) : [];
        
        // �������� ��� ������ � ������ ��� �������� ����������������
        function logDetailsInTree(items, depth = 0, parentSectionSize = { x: w, y: h, z: d }) {
          items.forEach(item => {
            if (item.type === 'wall' && item.spec?.detailTypeId) {
              // ��������� ��� ������ ��������� � ������
              const sectionCenterX = -parentSectionSize.x / 2;
              const sectionCenterY = -parentSectionSize.y / 2;
              const sectionCenterZ = -parentSectionSize.z / 2;
              
              const detailPosX_m = (sectionCenterX + item.pos.x) / 1000;
              const detailPosY_m = (sectionCenterY + item.pos.y) / 1000;
              const detailPosZ_m = (sectionCenterZ + item.pos.z) / 1000;
              // ����������� �������� ��� vertical_left
              if (item.spec.detailTypeId === 'vertical_left') {
                // ⭐ ����������: ���� pivot ������ � ������ ����� ������� ����� (x=-1, y=-1, z=-1),
                // �� ������ ������ ���� ������� � ������ � ������� ���� ������
                const expectedX = 0; // ⭐ ����������: ���� 16 (������� ���������), ������ 0
                const expectedY = 0;
                const expectedZ = 0; // ⭐ ����������: ���� parentSectionSize.z (�������� ����), ������ 0 (������ ����)
                
                if (item.pos.x !== expectedX || item.pos.y !== expectedY || item.pos.z !== expectedZ) {
                  console.error('[CLD][detail] ❌ ������: vertical_left � ������������ �������!', {
                    expected: { x: expectedX, y: expectedY, z: expectedZ },
                    actual: item.pos,
                    problem: item.pos.x !== expectedX ? `�� �� ����� ���� (������ ���� ${expectedX}��, �.�. ������� � ������ ����)!` : 
                             item.pos.z !== expectedZ ? `�� �� ������ ���� (������ ���� ${expectedZ}��, �.�. ������� � ������� ����)!` : 
                             `������� Y ������������ (������ ���� ${expectedY}�� �� ����)!`
                  });
                } else {
                }
              }
            }
            
            // ��������� ������ ������ ��� �������� ���������
            const currentSectionSize = item.type === 'fill_section' ? item.size : parentSectionSize;
            
            if (item.children && item.children.length > 0) {
              logDetailsInTree(item.children, depth + 1, currentSectionSize);
            }
          });
        }
        
        if (tree && tree.length > 0) {
          logDetailsInTree(tree);
        }

        // ���� ������ ������, ���������� ��������� ������ �� ��������� (db.json / templates[0].template.tree)
        if (!tree || tree.length === 0) {
          tree = [
            {
              "type": "fill_section",
              "name": "����������� ������",
              "id": "",
              "lib": "",
              "tags": "",
              "interactive": 0,
              "spec": [],
              "custom": [],
              "children": [
                {
                  "type": "wall",
                  "name": "������",
                  "id": "",
                  "lib": "",
                  "tags": "",
                  "interactive": 0,
                  "spec": {
                    "name": "",
                    "code": "",
                    "orientation": "v",
                    "group": "wall",
                    "type": "common",
                    "type_params": [],
                    "points": [],
                    "butts": [],
                    "key": "left",
                    "shape": null,
                    "material": {
                      "group": "g0",
                      "key": "material_2",
                      "id": 0,
                      "variant_id": 0,
                      "rotated": 0
                    }
                  },
                  "custom": [],
                  "children": [],
                  "condition": null,
                  "visible": 0,
                  "helpers_visible": 0,
                  "active": 1,
                  "variables": {
                    "visible": 1,
                    "main": []
                  },
                  "interaction": {
                    "auto_rotation": 1,
                    "check_intersection": 0,
                    "raycast": 1
                  },
                  "resizable": {
                    "enabled": 0,
                    "locks": [],
                    "minmax": {
                      "min": { "x": 0, "y": 0, "z": 0 },
                      "max": { "x": 0, "y": 0, "z": 0 }
                    }
                  },
                  "size": { "x": "@section.width", "y": "@section.height", "z": "$wall.thickness" },
                  "pos": { "x": 0, "y": 0, "z": 0 },
                  "pivot": { "x": -1, "y": -1, "z": -1 },
                  "rot": { "x": 0, "y": 0, "z": 0 },
                  "c_rot": { "x": 0, "y": 0, "z": 0 },
                  "events": {
                    "on_before_params": "",
                    "on_before_build": "",
                    "on_after_build": "",
                    "on_drag_end": ""
                  }
                }
              ],
              "condition": null,
              "visible": 0,
              "helpers_visible": 0,
              "active": 1,
              "variables": {
                "visible": 1,
                "main": []
              },
              "interaction": {
                "auto_rotation": 1,
                "check_intersection": 0,
                "raycast": 1
              },
              "resizable": {
                "enabled": 0,
                "locks": [],
                "minmax": {
                  "min": { "x": 0, "y": 0, "z": 0 },
                  "max": { "x": 0, "y": 0, "z": 0 }
                }
              },
              "size": { "x": "@section.width", "y": "@section.height", "z": "@section.depth" },
              "pos": { "x": 0, "y": 0, "z": 0 },
              "pivot": { "x": -1, "y": -1, "z": -1 },
              "rot": { "x": 0, "y": 0, "z": 0 },
              "c_rot": { "x": 0, "y": 0, "z": 0 },
              "events": {
                "on_before_params": "",
                "on_before_build": "",
                "on_after_build": "",
                "on_drag_end": ""
              }
            }
          ];
        }

        // ���������� ����������� ��������� ���������� ��� Module (extends CabinetSection)
        return {
          type: 'module',
          name: '(������ ��� ��������)',
          id: 'module_root',
          size: { x: w, y: h, z: d },
          pos: { x: 0, y: 0, z: 0 },
          pivot: { x: -1, y: -1, z: -1 },
          rot: { x: 0, y: 0, z: 0 },
          active: 1,
          interactive: 1,
          variables: { main: {} },
          // ����� ������ ������
          template: { structure: tree },
          spec: {
            template: { tree }
          }
        };
      }

      let __ppPreviewIframe = null;
      let __ppPreviewIframeReady = false;

      // ===== Clean-room preview sync (constructor-clodis.html) =====
      // ��� ������ ������ ���������� ����: section/wall (����������), ��� �������.
      function __ppBuildClodisTemplateTreeFromDom(rootContainer) {
        const toNumOrExpr = (v, fallbackExpr) => {
          if (v === undefined || v === null) return fallbackExpr;
          const s = String(v).trim();
          if (s === '') return fallbackExpr;
          const n = Number(s);
          return Number.isFinite(n) ? n : s; // allow expressions like "@section.width"
        };

        // ������� ���� �� ������ clean-room helper (UI � ������ ������ ��������� 1:1).
        function getDetailDefaults(detailTypeId) {
          if (typeof window.__cldGetDetailDefaults === 'function') {
            return window.__cldGetDetailDefaults(detailTypeId);
          }
          return null;
        }

        function nodeToParams(nodeEl, path) {
          const nodeType = nodeEl.getAttribute('data-node-type') || 'section';
          const nd = nodeEl.nodeData || {};
          const name = nd.name || nodeEl.getAttribute('data-node-name') || (nodeType === 'detail' ? '������' : '������');
          const active = nd.active === false ? 0 : 1;
          if (path) nodeEl.dataset.cldPath = path;

          if (nodeType === 'section') {
            const size = nd.size || {};
            const pos = nd.position || {};
            const pathStr = path != null ? String(path) : '';
            const isSubSection = pathStr.indexOf(',') !== -1;
            if (isSubSection) {
              ['x', 'y', 'z'].forEach((axis) => {
                const v = size[axis];
                if (v === undefined || v === null || String(v).trim() === '') {
                  console.warn(
                    '[CLD][export] ��������� "' +
                      (name || '') +
                      '" (path ' +
                      pathStr +
                      '): ������ size.' +
                      axis +
                      ' � ���� @section.* ��� � �����. ������� ����� � ��������� ����.'
                  );
                }
              });
            }

            // ��������: �������� ������ � @section.*; ��������� ��������� ����.
            const lrRaw = nd.sectionLayoutRole ?? nd.layout_role;
            const layout_role =
              typeof window.__cldNormalizeSectionLayoutRole === 'function'
                ? window.__cldNormalizeSectionLayoutRole(lrRaw)
                : String(lrRaw || '').trim();

            const item = {
              type: 'section', // fill_section ������
              name,
              active,
              size: {
                x: toNumOrExpr(size.x, '@section.width'), // �� ��������� ������ ��������
                y: toNumOrExpr(size.y, '@section.height'), // �� ��������� ������ ��������
                z: toNumOrExpr(size.z, '@section.depth')  // �� ��������� ������ ��������
              },
              pos: {
                x: toNumOrExpr(pos.x, 0),
                y: toNumOrExpr(pos.y, 0),
                z: toNumOrExpr(pos.z, 0)
              },
              pivot: { x: -1, y: -1, z: -1 },
              rot: { x: 0, y: 0, z: 0 },
              spec: { orientation: 'f' }, // ��������: �� ��������� 'f' (front) ��� ������
              ...(layout_role ? { layout_role } : {}),
              children: []
            };

            const childrenContainer = nodeEl.querySelector(':scope > .tree-node-children');
            if (childrenContainer) {
              const directChildren = Array.from(childrenContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
              directChildren.forEach((childEl, childIdx) => {
                const childParams = nodeToParams(childEl, `${path},${childIdx}`);
                if (childParams) {
                  item.children.push(childParams);
                  if (childParams.type === 'wall' && childParams.spec?.detailTypeId) {
                  }
                }
              });
            }
            return item;
          }

          // detail → wall, facade ��� module (��� ������: type: 'facade' ��� CabinetFacadeNode, type: 'module' → fill_module)
          // ��������: ������ � element_type: "dveri_shkaf" (�����) �������� ��� type: 'module' � spec.direction
          const isDoorModule = nd.originalType === 'module' && nd.spec?.element_type === 'dveri_shkaf';
          const isFacade = nd.originalType === 'facade' || (nd.originalType !== 'module' && (nd.modelId || nd.spec?.id || (String(nd.name || name || '').indexOf('�����') !== -1)));
          const isModule = nd.originalType === 'module'; // ��� ������ (������� �����) ���������� ��� type: 'module'
          
          // ������ �� ��������� (�����, �����, ���): ���������� ��� type: 'module' � ������ (fill_module)
          if (isModule) {
            // ��������: ��� ������� �� JSON, ���� size.z �� �����, ���������� ���������� �������� (16��)
            // ������ ��������� '@section.depth', �.�. ������ ������ ����� ������������� �������
            const sizeZ = nd.size?.z;
            const sizeZValue = (sizeZ === undefined || sizeZ === null || String(sizeZ).trim() === '') 
              ? 16  // ��������� ������� ������ (��� � ������)
              : toNumOrExpr(sizeZ, 16);
            
            // ��������: ��� ������� ������ (isDoorModule) ��������� spec.direction ���� ��� ���
            // � JSON � ������� ������ ����� �� ���� spec.direction, �� ��� ����������� ���������������� ����� '-z'
            const moduleSpec = { ...(nd.spec || {}) };
            if (isDoorModule && !moduleSpec.direction) {
              moduleSpec.direction = '-z'; // �������� ����� (�����)
            }
            
            const modulePayload = {
              type: 'module',
              name,
              active,
              size: {
                // toNumOrExpr ������������ undefined/null/������ ������ � ���������� fallback
                x: toNumOrExpr(nd.size?.x, '@section.width'),
                y: toNumOrExpr(nd.size?.y, '@section.height'),
                z: sizeZValue
              },
              pos: {
                x: toNumOrExpr(nd.position?.x, 0),
                y: toNumOrExpr(nd.position?.y, 0),
                z: toNumOrExpr(nd.position?.z, 0)
              },
              pivot: nd.anchor || { x: -1, y: -1, z: -1 },
              rot: {
                x: toNumOrExpr(nd.rotation?.x, 0),
                y: toNumOrExpr(nd.rotation?.y, 0),
                z: toNumOrExpr(nd.rotation?.z, 0)
              },
              c_rot: nd.c_rot ? {
                x: toNumOrExpr(nd.c_rot.x, 0),
                y: toNumOrExpr(nd.c_rot.y, 0),
                z: toNumOrExpr(nd.c_rot.z, 0)
              } : undefined,
              spec: moduleSpec,
              children: []
            };
            
            console.log('[CLD][UI→Preview] ������ ������������ � ������:', name, {
              type: 'module',
              size: modulePayload.size,
              pos: modulePayload.pos,
              pivot: modulePayload.pivot,
              nd_originalType: nd.originalType,
              nd_size: nd.size,
              nd_position: nd.position,
              // ⭐ �����: ���������� ��� ������ ������ �� JSON � ��� ������������
              json_size_z: nd.size?.z,
              toNumOrExpr_result_z: modulePayload.size.z,
              spec: nd.spec
            });
            
            return modulePayload;
          }
          
          // ⭐ �����: ���������� detailTypeId ��� ����������� ����������������
          const detailTypeId = nd.detailType || nodeEl.getAttribute('data-detail-type');
          const size = nd.size || {};
          const pos = nd.position || {};
          
          const fillKey = (nd.fill_key || '').toString().toLowerCase();
          
          // ��������: ���������� side �� fill_key (��������� ���� ������)
          let side = 'back'; // �� ���������
          if (fillKey === 'left' || fillKey === 'right' || fillKey === 'front' || fillKey === 'back' || 
              fillKey === 'top' || fillKey === 'bottom' || fillKey === 'center') {
            side = fillKey;
          } else if (detailTypeId === 'vertical_left') {
            side = 'left';
          } else if (detailTypeId === 'vertical_right') {
            side = 'right';
          } else if (detailTypeId === 'horizontal_top') {
            side = 'top';
          } else if (detailTypeId === 'horizontal_bottom') {
            side = 'bottom';
          }
          
          // ��������: ���������� orientation � direction �� spec ��� �� ���������
          const detailOrientationRaw = nd.detailOrientation || (detailTypeId?.includes('horizontal') ? 'h' : 'v');
          const detailOrientation =
            detailOrientationRaw === 'vertical' ? 'v' :
            detailOrientationRaw === 'horizontal' ? 'h' :
            detailOrientationRaw === 'front' ? 'f' :
            detailOrientationRaw;
          const orientation = nd.spec?.orientation || detailOrientation || (fillKey === 'top' || fillKey === 'bottom' || fillKey === 'center' ? 'h' : 'v');
          // ��� ������ �� �������� �����: direction '-z' (� ������ pivot = ������ ����� ������)
          const direction = nd.spec?.direction || (isFacade ? '-z' : 'z');

          // ���� ��� ���� �� 9 ����� � ����������� ������� ��� � ������������.
          const dflt = detailTypeId ? getDetailDefaults(detailTypeId) : null;
          
          const resultPos = {
            x: toNumOrExpr(pos.x, dflt?.pos?.x ?? 0),
            y: toNumOrExpr(pos.y, dflt?.pos?.y ?? 0),
            z: toNumOrExpr(pos.z, dflt?.pos?.z ?? 0)
          };
          
          const result = {
            type: isFacade ? 'facade' : 'wall',
            name,
            active,
            size: {
              x: toNumOrExpr(size.x, dflt?.size?.x ?? '@section.width'),
              y: toNumOrExpr(size.y, dflt?.size?.y ?? '@section.height'),
              z: toNumOrExpr(size.z, dflt?.size?.z ?? '$wall.thickness')
            },
            pos: resultPos,
            pivot: (() => {
              // ���������� ���������������� anchor, ���� �� ����� (� ��� �� ������ "�������" ������ ��� �����).
              const hasAnchor = !!nd.anchor;
              const isZeroAnchor =
                hasAnchor &&
                Number(nd.anchor?.x) === 0 &&
                Number(nd.anchor?.y) === 0 &&
                Number(nd.anchor?.z) === 0;
              const useAnchor = hasAnchor && (nd.anchor_user_set || !isZeroAnchor);
              return useAnchor ? nd.anchor : (dflt?.pivot ?? { x: -1, y: -1, z: -1 });
            })(),
            rot: {
              x: toNumOrExpr(nd.rotation?.x ?? 0, 0),
              y: toNumOrExpr(nd.rotation?.y ?? 0, 0),
              z: toNumOrExpr(nd.rotation?.z ?? 0, 0)
            },
            spec: { 
              orientation, 
              direction, 
              side: dflt?.spec?.side ?? side,
              ...(detailTypeId ? { detailTypeId } : {}),
              ...(isFacade && (nd.modelId || nd.spec?.id) ? { id: String(nd.modelId || nd.spec?.id || '') } : {}),
              // �����: �� ���������� ����������, ��������� � ���������.
              // ������ �� ������� ��������� ������ ���� � ������ ��� ����� orientation.
              ...((nd?.spec?.orientation || nd?.orientation) ? {} : (dflt?.spec?.orientation ? { orientation: dflt.spec.orientation } : {})),
              // ��������: �������� edge_numbering ��� spec.show_index (� ��������� ��� spec.show_index)
              ...(nd.edge_numbering !== undefined ? { show_index: nd.edge_numbering !== false } : {}),
              // ��������: ��� �������-������ �������� element_type � ������ ���� �� spec
              ...(isDoorModule && nd.spec ? { element_type: nd.spec.element_type, ...nd.spec } : {})
            },
            // ��������: ��������� accessories (��� � REFERENCE_ACCESSORIES_CODE.js)
            ...(nd.accessories && nd.accessories.length > 0 ? { accessories: nd.accessories } : {}),
            // ���������: ��� � ���������, � ������ ������ ���� ������ (�� ��������� g0),
            // ����� � ������ ����� �������������� ������ vars._wt � �� ����� ������� �� g:g0.thickness.
            ...(nd.material_id ? { material_id: nd.material_id } : {}),
            material_key: (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(nd.material_key || nd.materialKey) : (nd.material_key || nd.materialKey)) || 'material_2',
            material_group: (nd.material_group || nd.materialGroup || 'g0'),
            ...(() => {
              let icon = nd.material_icon || nd.materialIcon;
              if (!icon && nd.material_id && (nd.material_key || nd.materialKey)) {
                const lib = window.__cldMaterialsLib;
                const mk = nd.material_key || nd.materialKey || 'material_2';
                const item = Array.isArray(lib?.itemsByKey?.[mk]) ? lib.itemsByKey[mk].find(x => String(x.id) === String(nd.material_id)) : null;
                icon = (item?.texture || item?.texture_url || item?.image || item?.icon) || '';
              }
              return icon ? { material_icon: icon } : {};
            })(),
            // ��������: �������� edges � ����������� (������������ � CabinetWallNode._build_edges)
            ...(nd.edges && Object.keys(nd.edges).length > 0 ? { edges: (() => {
              const out = {};
              for (let i = 1; i <= 4; i++) {
                if (nd.edges[i] && nd.edges[i].enabled) {
                  out[i] = {
                    enabled: true,
                    thickness: parseFloat(nd.edges[i].thickness) || 0.2,
                    type: nd.edges[i].type || 'butts',
                    ...(nd.edges[i].type_name ? { type_name: nd.edges[i].type_name } : {}),
                    ...(nd.edges[i].color ? { color: nd.edges[i].color } : {}),
                    ...(nd.edges[i].icon ? { icon: nd.edges[i].icon } : {}),
                    ...(nd.edges[i].decor_id ? { decor_id: nd.edges[i].decor_id } : {}),
                    ...(nd.edges[i].decor_name ? { decor_name: nd.edges[i].decor_name } : {}),
                    ...(nd.edges[i].edge_id ? { edge_id: nd.edges[i].edge_id } : {}),
                    ...(nd.edges[i].edge_name ? { edge_name: nd.edges[i].edge_name } : {})
                  };
                }
              }
              try {
                const logNodeId = nodeEl?.getAttribute && nodeEl.getAttribute('data-node-id');
              } catch (e) {
                console.warn('[CLD][edge][nodeToParams] log failed', e);
              }
              return out;
            })() } : {}),
            // ��������: �������� edge_numbering ��� ����������� ������� ������
            ...(nd.edge_numbering !== undefined ? { edge_numbering: nd.edge_numbering !== false } : {})
          };
          
          // �������� ������ ��� ������� ����������������
          if (isFacade) {
            console.log('[CLD][UI→Preview] ����� ������������ � ������:', name, {
              type: 'facade',
              size: result.size,
              pos: result.pos,
              pivot: result.pivot,
              direction,
              orientation,
              nd_originalType: nd.originalType,
              nd_size: nd.size,
              nd_position: nd.position,
              nd_spec_direction: nd.spec?.direction,
              nd_anchor: nd.anchor
            });
          }
          
          return result;
        }

        const nodes = Array.from(rootContainer.children).filter(ch => ch.classList?.contains('constructor-tree-node'));
        return nodes.map((nodeEl, idx) => nodeToParams(nodeEl, `0,${idx}`));
      }

      // ��������: debounce ��� ������������� ����� �� ����������� ���������
      let __ppSyncTimeout = null;
      function __ppSyncPreviewToIframe() {
        if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;
        // �� ����� � iframe ����� ����� ����, ��� ������ ������ ��� ������ �� iframe (������� ��������)
        if (window.__ppSuppressSyncUntil && Date.now() < window.__ppSuppressSyncUntil) return;

        // ��������� ��������� DOM-������ � ����� �� clodisJSONReady, ����� �� ������������ ���������.
        window.__ppTreeReloadSuppressedUntil = Date.now() + 1400;
        
        // ��������: �������� ���������� ����� ���� �� ��� �� ����������
        if (__ppSyncTimeout) {
          clearTimeout(__ppSyncTimeout);
        }
        
        // ��������: ��������� ������������� � ��������� ��������� ����� �������� ������������
        __ppSyncTimeout = setTimeout(() => {
          __ppSyncTimeout = null;

          try {
            const sn =
              (typeof currentSelectedNode !== 'undefined' && currentSelectedNode) ||
              window.__cldCurrentSelectedNode ||
              window.currentSelectedNode;
            if (sn && typeof saveConstructorNodeData === 'function') saveConstructorNodeData(sn);
          } catch (_) {}
          
          const widthInput = document.getElementById('catalog-item-edit-width');
          const heightInput = document.getElementById('catalog-item-edit-height');
          const depthInput = document.getElementById('catalog-item-edit-depth');

          const w = widthInput ? Number(widthInput.value) || 300 : 300;
          const h = heightInput ? Number(heightInput.value) || 400 : 400;
          const d = depthInput ? Number(depthInput.value) || 200 : 200;

          const rootModule = document.getElementById('constructor-root-module');
          const childrenRoot = document.getElementById('constructor-root-module-children');
          // ������� ������ �� DOM (����� ����������� ������������� ������ �������� � iframe), ����� �� nodeData
          const treeFromDom = childrenRoot ? __ppBuildClodisTemplateTreeFromDom(childrenRoot) : [];
          const hasDomTree = Array.isArray(treeFromDom) && treeFromDom.length > 0;
          let tree = hasDomTree ? treeFromDom : ((rootModule?.nodeData?.clodisJSON) ?? (rootModule?.nodeData?.constructor_structure) ?? []);
          if (tree == null) tree = [];
          // ����� �������� � iframe ��������� ���������� ������ � nodeData, ����� ��� ���������� ���� ��� �����
          if (hasDomTree && rootModule) {
            rootModule.nodeData = rootModule.nodeData || {};
            rootModule.nodeData.clodisJSON = treeFromDom;
          }
          // ��������� ������ �� legacy constructor_structure (template.structure / spec.template.tree), ���� ������ ������
          if (tree && typeof tree === 'object' && !Array.isArray(tree)) {
            const arr = tree.template?.structure ?? tree.spec?.template?.tree;
            if (Array.isArray(arr) && arr.length) tree = arr;
          }
          const hasTree = (Array.isArray(tree) && tree.length > 0) || (tree && typeof tree === 'object' && !Array.isArray(tree));
          // ���� ������ ��� ������� (window.__CLD_DEBUG = true)
          if (window.__CLD_DEBUG && hasTree && Array.isArray(tree)) {
            const modulesInTree = [];
            const walkTree = (items, path = '') => {
              items.forEach((item, idx) => {
                const currentPath = path ? `${path}[${idx}]` : `[${idx}]`;
                if (item.type === 'module') {
                  modulesInTree.push({ path: currentPath, name: item.name, size: item.size, pos: item.pos, pivot: item.pivot });
                }
                if (item.children && item.children.length > 0) {
                  walkTree(item.children, `${currentPath}.children`);
                }
              });
            };
            walkTree(tree);
            console.log('[CLD][Preview] ������ ��� ������:', {
              totalItems: tree.length,
              modulesFound: modulesInTree.length,
              modules: modulesInTree,
              fullTree: tree
            });
          }
          
          // ���� ��������� ������� ������ ��� __CLD_DEBUG
          if (window.__CLD_DEBUG && hasTree && Array.isArray(tree)) {
            function logDetailCoordinatesInTree(items, sectionSize, depth = 0) {
              items.forEach(item => {
                if (item.type === 'wall' && item.spec?.detailTypeId) {
                  const detailX_mm = typeof item.pos?.x === 'number' ? item.pos.x : 0;
                  const detailY_mm = typeof item.pos?.y === 'number' ? item.pos.y : 0;
                  const detailZ_mm = typeof item.pos?.z === 'number' ? item.pos.z : 0;
                  
                  // ��������� ���������� ������ ������������ ������ (� ������ ��� Three.js)
                  const sectionLeft_m = -sectionSize.x / 2000; // -w/2 � ������
                  const sectionRight_m = sectionSize.x / 2000; // w/2 � ������
                  const sectionBottom_m = -sectionSize.y / 2000; // -h/2 � ������
                  const sectionTop_m = sectionSize.y / 2000; // h/2 � ������
                  const sectionBack_m = -sectionSize.z / 2000; // -d/2 � ������
                  const sectionFront_m = sectionSize.z / 2000; // d/2 � ������
                  
                  const detailX_m = (sectionLeft_m * 1000 + detailX_mm) / 1000;
                  const detailY_m = (sectionBottom_m * 1000 + detailY_mm) / 1000;
                  const detailZ_m = (sectionBack_m * 1000 + detailZ_mm) / 1000;
                  // ����������� �������� ��� vertical_left
                  if (item.spec.detailTypeId === 'vertical_left') {
                    // ⭐ ����������: ���� pivot ������ � ������ ����� ������� ����� (x=-1, y=-1, z=-1),
                    // �� ������ ������ ���� ������� � ������ � ������� ���� ������
                    const expectedX = 0; // ⭐ ����������: ���� 16 (������� ���������), ������ 0
                    const expectedY = 0;
                    const expectedZ = 0; // ⭐ ����������: ���� sectionSize.z (�������� ����), ������ 0 (������ ����)
                    if (detailX_mm !== expectedX || detailY_mm !== expectedY || detailZ_mm !== expectedZ) {
                      console.error('[CLD][detail] ❌ ������: vertical_left � ������������ �������!', {
                        should_be: `${expectedX}�� �� ������ ���� (������� � ������ ����), ${expectedY}�� �� ����, ${expectedZ}�� �� ������� (������� � ������� ����)`,
                        actually_is: `${detailX_mm}�� �� ������, ${detailY_mm}�� �� ����, ${detailZ_mm}�� �� �������`,
                        problem: detailX_mm !== expectedX ? `�� �� ����� ���� (������ ���� ${expectedX}�� �� ������ ����, �.�. ������� � ������ ����)!` : 
                                 detailZ_mm !== expectedZ ? `�� �� ������ ���� (������ ���� ${expectedZ}�� �� �������, �.�. ������� � ������� ����)!` : 
                                 `������� Y ������������ (������ ���� ${expectedY}�� �� ����)!`
                      });
                    } else {
                    }
                  }
                }
                
                // ���������� ��������� �������� ��������
                if (item.children && item.children.length > 0) {
                  const childSectionSize = item.type === 'section' ? {
                    x: typeof item.size?.x === 'number' ? item.size.x : sectionSize.x,
                    y: typeof item.size?.y === 'number' ? item.size.y : sectionSize.y,
                    z: typeof item.size?.z === 'number' ? item.size.z : sectionSize.z
                  } : sectionSize;
                  logDetailCoordinatesInTree(item.children, childSectionSize, depth + 1);
                }
              });
            }
            
            const sectionSize = { x: w, y: h, z: d };
            logDetailCoordinatesInTree(tree, sectionSize);
          }

          // 1) ������ ������
          __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setSize', sizeMm: { w, h, d } }, '*');
          // 1.1) vars/materials (�������/��������� �����)
          try {
            // �������� ������� ���������� � iframe, ���� ������� ����� debug � �������
            if (window.__CLD_DEBUG || window.__CLD_DEBUG_MATERIALS) {
              __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setDebug', flags: { materials: true } }, '*');
            }
            const payload = (typeof window.__cldBuildMaterialsPayload === 'function')
              ? window.__cldBuildMaterialsPayload()
              : (window.__cldMaterialsLib ? (function(){
                  // fallback � ��������� ������ ��������
                  const lib = window.__cldMaterialsLib;
                  const st = window.__cldMaterialsState || { groupOverrides: {} };
                  const out = {};
                  for (const g of lib.groups || []) {
                    const key = g.key;
                    if (!key) continue;
                    const ov = st.groupOverrides?.[key] || {};
                    const materialKey = (typeof window.__cldNormalizeMaterialKey === 'function' ? window.__cldNormalizeMaterialKey(ov.material_key || g.material) : (ov.material_key || g.material)) || (lib?.keys?.[0]?.key) || 'material_2';
                    const materialId = ov.material_id || 0;
                    const thickness = Number(ov.thickness ?? g.thickness ?? 16);
                    out[key] = { thickness, material: { key: materialKey, id: materialId, variant_id: 0 } };
                  }
                  const g0t = out.g0?.thickness ?? 16;
                  return { vars: { _wt: Number(g0t) || 16 }, materials: out };
                })() : { vars: { _wt: 16 }, materials: {} });

            // ���������� ������ (�� ������� "����������") ��������� � ctx.vars,
            // �� �� ���������� ��������� _wt (�� ��� �� ���������� g0 � ��������� ��������).
            const moduleVars = (() => {
              const root = document.getElementById('constructor-root-module');
              const main = root?.nodeData?.variables?.main;
              if (!main || typeof main !== 'object') return {};
              const out = {};
              for (const [k, v] of Object.entries(main)) {
                const key = String(k || '').trim();
                if (!key || key === '_wt') continue;
                const n = Number(v);
                if (!Number.isFinite(n)) continue;
                out[key] = n;
              }
              return out;
            })();
            const mergedVars = { ...(moduleVars || {}), ...(payload.vars || {}) };

            __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setVars', vars: mergedVars }, '*');
            __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:setMaterials', materials: payload.materials || {} }, '*');

            if (window.__CLD_DEBUG) {
              const thickIn = document.getElementById('catalog-constructor-property-material-thickness');
            }
          } catch {}

          // ���� ���������� ���������� ��� �� ����������� � ��������� � ������������������ (���� ���).
          if (!window.__cldMaterialsLib && !window.__cldMaterialsLoading && typeof window.__cldEnsureMaterialsLoaded !== 'function') {
            // no-op
          }
          if (!window.__cldMaterialsLib && !window.__cldMaterialsLoading && typeof window.__cldEnsureMaterialsLoaded === 'function') {
            window.__cldEnsureMaterialsLoaded()
              .then(() => {
                if (typeof window.__ppPostModuleToIframe === 'function') window.__ppPostModuleToIframe();
              })
              .catch(() => {});
          }
          // 2) ��������/��������� ������ �� ������� ������
          __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:toggleModule', on: !!hasTree }, '*');
          // 3) ������: ������ (clodisJSON) ��� ������ (constructor_structure � iframe �������������)
          __ppPreviewIframe.contentWindow.postMessage({
            type: 'cld:setTemplateTree',
            tree: tree,
            structure: tree,
            sizeMm: { w, h, d }
          }, '*');
        }, 50); // ��������: ��������� �������� ��� �������� ���������
      }

      // ��� �������� �������������: ��� ������ ������ ����� ���������������� ������ ���������
      window.__ppPostModuleToIframe = __ppSyncPreviewToIframe;
      window.__ppSyncPreviewToIframe = __ppSyncPreviewToIframe;
      // ������� ��� ���������� iframe-������ �� �������/������ ���������
      window.__ppToggleModuleToIframe = function(on) {
        if (!__ppPreviewIframe || !__ppPreviewIframe.contentWindow) return;
        __ppPreviewIframe.contentWindow.postMessage({ type: 'cld:toggleModule', on: !!on }, '*');
      };

      function ensureClodisPreviewMounted() {
        const viewport = document.getElementById('viewport');
        const previewBlock = document.getElementById('preview_block');
        if (!viewport) {
          console.error('[PREVIEW] viewport �� ������!');
          return;
        }

        viewport.setAttribute('data-preview', 'true');

        // ���� ��� ������� � ������ ��������� ���������
        if (__ppPreviewIframe) {
          __ppPostModuleToIframe();
          return;
        }

        // ������ iframe ������ #viewport
        viewport.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.setAttribute('title', 'Clodis Preview');
        iframe.setAttribute('loading', 'lazy');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '0';
        iframe.style.display = 'block';

        // Clean-room 3D preview (��� ������), ����������� �� Vite.
        // �����: ����� ���� ������ ���� (5173). ������� ��� ����� postMessage.
        // �� �� ����� ����� (:8000) � ������ ��������� same-origin
        iframe.src = '/constructor-clodis.html?embedded=1&v=20260503-click-toggles-all-swings';

        __ppPreviewIframe = iframe;
        viewport.appendChild(iframe);

        window.addEventListener('message', function onReady(ev) {
          if (ev?.data?.type !== 'cld:iframeReady') return;
          __ppPreviewIframeReady = true;
          window.removeEventListener('message', onReady);
          __ppPostModuleToIframe();
        });

        // ���� 1: iframe ������� clodisJSON � ������ ������ � ������� � ��������� � nodeData
        window.addEventListener('message', function onClodisJSONReady(ev) {
          if (ev?.data?.type !== 'cld:clodisJSONReady' || !Array.isArray(ev?.data?.clodisJSON)) return;
          const clodisJSON = ev.data.clodisJSON;
          const rootModule = document.getElementById('constructor-root-module');
          if (rootModule) {
            rootModule.nodeData = rootModule.nodeData || {};
            // �� �������������� nodeData � DOM ������ �������, ���� � DOM ��� ���� ���� (������������ ������� ������)
            const childrenRoot = document.getElementById('constructor-root-module-children');
            const treeFromDom = childrenRoot && typeof window.__ppBuildClodisTemplateTreeFromDom === 'function'
              ? window.__ppBuildClodisTemplateTreeFromDom(childrenRoot) : [];
            const skipTreeReload = window.__ppTreeReloadSuppressedUntil && Date.now() < window.__ppTreeReloadSuppressedUntil;
            try {
              const now = Date.now();
              const last = window.__cldDbgLastClodisJsonReadyTs || 0;
              const shouldLog = !last || (now - last) > 300;
              window.__cldDbgLastClodisJsonReadyTs = now;
              if (shouldLog) {
                const selEl = document.querySelector('.constructor-tree-item-selected');
                console.log('[CLD][clodisJSONReady][part3]', {
                  skipTreeReload,
                  clodisJsonLen: Array.isArray(clodisJSON) ? clodisJSON.length : null,
                  treeFromDomLen: Array.isArray(treeFromDom) ? treeFromDom.length : null,
                  domNodes: document.querySelectorAll('.constructor-tree-node').length,
                  selectedNodeId: selEl?.getAttribute?.('data-node-id') || window.currentSelectedNode?.getAttribute?.('data-node-id') || '',
                  ppTreeReloadSuppressedUntil: window.__ppTreeReloadSuppressedUntil,
                });
              }
            } catch (_) {}
            // ���� ������ ��� � DOM � �� ������������ �� iframe (��� ��������� ����� ��� s:y).
            if (treeFromDom.length > 0) {
              rootModule.nodeData.clodisJSON = treeFromDom;
              return;
            }
            rootModule.nodeData.clodisJSON = clodisJSON;
          }
          // �� ����� ������� � iframe 1.5 ��� � ����� ����: iframe→������→sync→iframe→��������
          window.__ppSuppressSyncUntil = Date.now() + 1500;
          if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
          if (typeof window.loadConstructorTreeFromJSON === 'function') {
            try {
              const selEl = document.querySelector('.constructor-tree-item-selected');
              console.log('[CLD][clodisJSONReady][part3] calling loadConstructorTreeFromJSON', {
                selectedNodeId: selEl?.getAttribute?.('data-node-id') || window.currentSelectedNode?.getAttribute?.('data-node-id') || '',
              });
            } catch (_) {}
            window.loadConstructorTreeFromJSON({ template: { structure: clodisJSON } });
          }
        });

        iframe.addEventListener('load', function() {
          // fallback � ���� ready �� ��������, �� ����� ��������� ��������� params
          if (!__ppPreviewIframeReady) __ppPostModuleToIframe();
        });
      }
      window.ensureClodisPreviewMounted = ensureClodisPreviewMounted;

      // ⚠️ �� ������������� �� window load: heavy engine ����� ��������� �������� �� "��������".
      // �������� ������ ��� �������� ������� "�����������" (initConstructorTab() ���� �������� ensureClodisPreviewMounted()).
      
      // �������� ������ �������� �������� ��� ��������������
      async function loadCatalogItemData(itemId, catalogType) {
        try {
          if (Number(itemId) > 0) window.__CLD_IS_NEW_MODULE = false;
          // ���������� ���������� endpoint � catalogType
          const response = await fetch(`/api/catalog/item/${catalogType}/${itemId}`);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          const data = await response.json();
          
          if (window.catalogItemVueApp && data) {
            const _d = data.data && typeof data.data === "object" ? data.data : data;
            // Заполняем данные во Vue приложение
            window.catalogItemVueApp.item = {
              name: (_d.name ?? data.name) || '',
              category: (function() {
                const c = _d.category ?? data.category;
                if (Array.isArray(c) && c.length) return c[0];
                if (c !== undefined && c !== null && c !== '') return c;
                return '';
              })(),
              show_in_spec: (_d.show_in_spec ?? data.show_in_spec) !== undefined ? String(_d.show_in_spec ?? data.show_in_spec) : '1',
              include_nested: (_d.include_nested ?? data.include_nested) !== undefined ? String(_d.include_nested ?? data.include_nested) : '1',
              show_in_constructor: (_d.show_in_constructor ?? data.show_in_constructor) !== undefined ? String(_d.show_in_constructor ?? data.show_in_constructor) : '1',
              order: _d.order ?? data.order ?? 0,
              icon: (_d.icon ?? data.icon) || '',
              module_group: (_d.module_group ?? data.module_group) || 'bottom',
              drag_type: (_d.drag_type ?? data.drag_type) || 'top',
              stick_type: (_d.stick_type ?? data.stick_type) || 'common',
              is_fill: (_d.is_fill ?? data.is_fill) !== undefined ? String(_d.is_fill ?? data.is_fill) : '0',
              no_intersections: (_d.no_intersections ?? data.no_intersections) !== undefined ? String(_d.no_intersections ?? data.no_intersections) : '0',
              catalog_type: (_d.catalog_type ?? data.catalog_type) || '',
              width: _d.width ?? data.width ?? 300,
              height: _d.height ?? data.height ?? 400,
              depth: _d.depth ?? data.depth ?? 200
            };
            console.log('[����] loadCatalogItemData:', itemId, catalogType);
            console.log('[����] API ����� data:', data);
            if (_d) console.log('[����] _d (��������):', { name: _d.name, width: _d.width, height: _d.height, depth: _d.depth, hasConstructor: !!(_d.constructor_structure ?? data.constructor_structure) });
            console.log('[����] ��������� � ����� item:', window.catalogItemVueApp?.item);
            // ���� �����������: 3D � iframe constructor-clodis.html; ������ � ������ � rootModule.nodeData.clodisJSON (�������� ��� ���������� � getConstructorTreeJSON).
            const rootModule = document.getElementById('constructor-root-module');
            if (rootModule) {
              const clodisJSON = _d.clodisJSON ?? (Array.isArray(_d.params) ? _d.params : null);
              let constructorStructure = _d.constructor_structure ?? data.constructor_structure ?? null;
              if (typeof constructorStructure === 'string') {
                try { constructorStructure = JSON.parse(constructorStructure); } catch (e) { constructorStructure = null; }
              }
              // ������ ������: �� clodisJSON ��� �� constructor_structure (����������� ������ � template.structure)
              let treeArray = Array.isArray(clodisJSON) && clodisJSON.length > 0 ? clodisJSON : null;
              if (!treeArray && constructorStructure && typeof constructorStructure === 'object') {
                treeArray = constructorStructure.template?.structure ?? constructorStructure.spec?.template?.tree ?? (Array.isArray(constructorStructure) ? constructorStructure : null);
              }
              if (!Array.isArray(treeArray)) treeArray = [];
              rootModule.nodeData = {
                clodisJSON: treeArray,
                constructor_structure: constructorStructure || null
              };
              if (treeArray.length > 0) {
                console.log('[����] ������ ��������� �� API, ����� �������� ������:', treeArray.length);
                if (typeof window.loadConstructorTreeFromJSON === 'function') {
                  setTimeout(() => {
                    if (typeof window.__cldInitConstructorTab === 'function') window.__cldInitConstructorTab();
                    window.loadConstructorTreeFromJSON({ template: { structure: treeArray } });
                  }, 150);
                }
              } else {
                console.log('[����] � ������ API ��� ������ ������������ (constructor_structure/clodisJSON ����� ��� �����������)');
              }
            }
          }
        } catch (error) {
          console.error('❌ ������ �������� ������ �������� ��������:', error);
        }
      }
      
      // �������� �������� �������������� ���� �������� (���������� �������)
      window.openCatalogTypeEdit = function openCatalogTypeEdit(itemId = 0) {
        // �������� ��� ��������
        document.querySelectorAll('.admin-page').forEach(page => {
          page.classList.remove('active');
        });
        
        // ���������� �������� ��������������
        const editPage = document.getElementById('catalog-type-edit');
        if (editPage) {
          editPage.classList.add('active');
          
          // ��������� URL
          window.history.pushState({ page: 'catalog-type-edit' }, '', `#catalog-type-edit?id=${itemId}`);
          
          // ��������� ������
          loadCatalogTypeEdit(itemId);
        }
      }
      
      // �������� ������ ��� �������������� ���� ��������
      async function loadCatalogTypeEdit(itemId) {
        try {
          const itemIdInput = document.getElementById('catalog-type-item-id');
          const nameInput = document.getElementById('catalog-type-name');
          const orderInput = document.getElementById('catalog-type-order');
          const activeInput = document.getElementById('catalog-type-active');
          const titleElement = document.getElementById('catalog-type-edit-title');
          const submitUrlInput = document.getElementById('catalog-type-form_submit_url');
          
          if (!itemIdInput || !nameInput || !orderInput || !activeInput || !titleElement || !submitUrlInput) {
            console.error('❌ �������� ����� �� �������');
            return;
          }
          
          itemIdInput.value = itemId;
          
          if (itemId === '0' || itemId === 0) {
            // ����� ����������
            titleElement.textContent = '�������� ��� ��������';
            nameInput.value = '';
            orderInput.value = '0';
            activeInput.checked = true;
            submitUrlInput.value = '/api/catalog/item_add/catalogs_keys/';
          } else {
            // ����� ��������������
            titleElement.textContent = `������������� ��� �������� #${itemId}`;
            submitUrlInput.value = `/api/catalog/item_edit/catalogs_keys/${itemId}`;
            
            // ��������� ������ ��������
            const response = await fetch(`/api/catalog/item/catalogs_keys/${itemId}`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const item = await response.json();
            nameInput.value = item.name || '';
            orderInput.value = item.order || '0';
            activeInput.checked = item.active !== undefined ? item.active == 1 : true;
          }
        } catch (error) {
          console.error('❌ ������ �������� ���� ��������:', error);
          alert(`������ ��������: ${error.message}`);
        }
      }
      
      // ���������� ���� �������� (JSON: Express �� ������ multipart ��� ����� ��������)
      async function saveCatalogType(exitAfterSave = false) {
        try {
          const itemId = document.getElementById('catalog-type-item-id').value;
          const name = document.getElementById('catalog-type-name').value;
          const order = document.getElementById('catalog-type-order').value;
          const active = document.getElementById('catalog-type-active').checked ? '1' : '0';
          const submitUrlInput = document.getElementById('catalog-type-form_submit_url');
          const submitUrl = submitUrlInput ? submitUrlInput.value : '/api/catalog/item_add/catalogs_keys/';
          
          if (!name || name.trim() === '') {
            alert('������� �������� ���� ��������');
            return;
          }
          
          const data = { name: name.trim(), order: parseInt(order) || 0, active: active };
          
          const response = await fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('��� �������� ������� ��������');
          } else {
            alert('��� �������� ������� ��������');
          }
          
          if (exitAfterSave) {
            // ������������ � ������ � ��������� ���
            window.location.hash = '#catalog-types';
            // ��������� ������ ��� ������������ ��������
            setTimeout(() => {
              loadCatalogTypes();
            }, 100);
          } else {
            // ��������� ID �������� ����� �������� (���� ��� ��� ����� �������)
            if (result.item && result.item.id) {
              document.getElementById('catalog-type-item-id').value = result.item.id;
              // ��������� ���������
              const titleElement = document.getElementById('catalog-type-edit-title');
              if (titleElement) {
                titleElement.textContent = `������������� ��� �������� #${result.item.id}`;
              }
              const submitUrlInputEl = document.getElementById('catalog-type-form_submit_url');
              if (submitUrlInputEl) submitUrlInputEl.value = `/api/catalog/item_edit/catalogs_keys/${result.item.id}`;
            }
          }
        } catch (error) {
          console.error('❌ ������ ���������� ���� ��������:', error);
          alert('������ ����������: ' + error.message);
        }
      }
      
      const saveCatalogTypeBtn = document.getElementById('save-catalog-type-btn');
      if (saveCatalogTypeBtn) {
        saveCatalogTypeBtn.addEventListener('click', () => saveCatalogType(false));
      }
      const saveAndExitCatalogTypeBtn = document.getElementById('save-and-exit-catalog-type-btn');
      if (saveAndExitCatalogTypeBtn) {
        saveAndExitCatalogTypeBtn.addEventListener('click', () => saveCatalogType(true));
      }
      
      // ���������� ������ "������"
      const cancelCatalogTypeBtn = document.getElementById('cancel-catalog-type-btn');
      if (cancelCatalogTypeBtn) {
        cancelCatalogTypeBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.hash = '#catalog-types';
        });
      }
      
      // �������� ���� �������� (�� ���������: show_swal � sweetalert) - ���������� �������
      window.deleteCatalogType = async function deleteCatalogType(itemId, itemName) {
        // ���������� sweetalert ���� ��������, ����� confirm
        if (typeof swal !== 'undefined') {
          swal({
            title: "�� �������?",
            text: `�� ������������� ������ ������� ��� �������� "${itemName}"?`,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonText: "���",
            confirmButtonText: "��",
            closeOnConfirm: true
          }, async function(isConfirm) {
            if (isConfirm) {
              await performDeleteCatalogType(itemId);
            }
          });
        } else {
          // Fallback �� ������� confirm ���� sweetalert �� ��������
          if (confirm(`�� �������, ��� ������ ������� ��� �������� "${itemName}"?`)) {
            await performDeleteCatalogType(itemId);
          }
        }
      };
      
      // �������� �������� �������������� ������ (���������� �������)
      window.openCatalogGroupEdit = function openCatalogGroupEdit(itemId = 0) {
        // �������� ��� ��������
        document.querySelectorAll('.admin-page').forEach(page => {
          page.classList.remove('active');
        });
        
        // ���������� �������� ��������������
        const editPage = document.getElementById('catalog-group-edit');
        if (editPage) {
          editPage.classList.add('active');
          
          // ��������� URL
          window.history.pushState({ page: 'catalog-group-edit' }, '', `#catalog-group-edit?id=${itemId}`);
          
          // ��������� ������
          loadCatalogGroupEdit(itemId);
        }
      };
      
      // �������� ������ ������ ��� ��������������
      async function loadCatalogGroupEdit(itemId) {
        try {
          const itemIdInput = document.getElementById('catalog-group-item-id');
          const nameInput = document.getElementById('catalog-group-name');
          const orderInput = document.getElementById('catalog-group-order');
          const activeInput = document.getElementById('catalog-group-active');
          const titleElement = document.getElementById('catalog-group-edit-title');
          const submitUrlInput = document.getElementById('group_form_submit_url');
          
          if (!itemIdInput || !nameInput || !orderInput || !activeInput || !titleElement || !submitUrlInput) {
            console.error('❌ �������� ����� �� �������');
            return;
          }
          
          itemIdInput.value = itemId;
          
          if (itemId === '0' || itemId === 0) {
            // ����� ����������
            titleElement.textContent = '�������� ������';
            nameInput.value = '';
            orderInput.value = '0';
            activeInput.checked = true;
            submitUrlInput.value = '/api/catalog/item_add/modules_groups/';
          } else {
            // ����� ��������������
            titleElement.textContent = `������������� ������ #${itemId}`;
            submitUrlInput.value = `/api/catalog/item_edit/modules_groups/${itemId}`;
            
            // ��������� ������ ��������
            const response = await fetch(`/api/catalog/item/modules_groups/${itemId}`);
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const item = await response.json();
            nameInput.value = item.name || '';
            orderInput.value = item.order || '0';
            activeInput.checked = item.active !== undefined ? item.active == 1 : true;
          }
        } catch (error) {
          console.error('❌ ������ �������� ������:', error);
          alert(`������ ��������: ${error.message}`);
        }
      }
      
      // ���������� ������
      async function saveCatalogGroup(exitAfterSave = false) {
        try {
          const itemId = document.getElementById('catalog-group-item-id').value;
          const name = document.getElementById('catalog-group-name').value;
          const order = document.getElementById('catalog-group-order').value;
          const active = document.getElementById('catalog-group-active').checked ? '1' : '0';
          const submitUrl = document.getElementById('group_form_submit_url').value;
          
          if (!name || name.trim() === '') {
            alert('������� �������� ������');
            return;
          }
          
          const data = { name: name.trim(), order: parseInt(order) || 0, active: active };
          
          const response = await fetch(submitUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('������ ������� ���������');
          } else {
            alert('������ ������� ���������');
          }
          
          if (exitAfterSave) {
            // ��������� ������ ����� ����������
            window.location.hash = '#catalog-groups';
            // ��������� �������� ��� ������������ ��������
            setTimeout(() => {
              // ���������� �� ������ �������� � �������������
              catalogGroupsPagination.currentPage = 1;
              loadCatalogGroups();
            }, 200);
          } else {
            if (result.item && result.item.id) {
              document.getElementById('catalog-group-item-id').value = result.item.id;
              const titleElement = document.getElementById('catalog-group-edit-title');
              if (titleElement) {
                titleElement.textContent = `������������� ������ #${result.item.id}`;
              }
              const submitUrlInput = document.getElementById('group_form_submit_url');
              if (submitUrlInput) {
                submitUrlInput.value = `/api/catalog/item_edit/modules_groups/${result.item.id}`;
              }
            }
          }
        } catch (error) {
          console.error('❌ ������ ���������� ������:', error);
          alert(`������ ����������: ${error.message}`);
        }
      }
      
      // ����������� ������ ���������� ��� �����
      const saveCatalogGroupBtn = document.getElementById('save-catalog-group-btn');
      if (saveCatalogGroupBtn) {
        saveCatalogGroupBtn.addEventListener('click', () => saveCatalogGroup(false));
      }
      
      const saveAndExitCatalogGroupBtn = document.getElementById('save-and-exit-catalog-group-btn');
      if (saveAndExitCatalogGroupBtn) {
        saveAndExitCatalogGroupBtn.addEventListener('click', () => saveCatalogGroup(true));
      }
      
      // ���������� ������ "������" ��� �����
      const cancelCatalogGroupBtn = document.getElementById('cancel-catalog-group-btn');
      if (cancelCatalogGroupBtn) {
        cancelCatalogGroupBtn.addEventListener('click', function(e) {
          e.preventDefault();
          window.location.hash = '#catalog-groups';
        });
      }
      
      // �������� ������ (���������� �������)
      window.deleteCatalogGroup = async function deleteCatalogGroup(itemId, itemName) {
        if (typeof swal !== 'undefined') {
          swal({
            title: "�� �������?",
            text: `�� ������������� ������ ������� ������ "${itemName}"?`,
            type: "warning",
            showCancelButton: true,
            confirmButtonColor: "#DD6B55",
            cancelButtonText: "���",
            confirmButtonText: "��",
            closeOnConfirm: true
          }, async function(isConfirm) {
            if (isConfirm) {
              await performDeleteCatalogGroup(itemId);
            }
          });
        } else {
          if (confirm(`�� �������, ��� ������ ������� ������ "${itemName}"?`)) {
            await performDeleteCatalogGroup(itemId);
          }
        }
      };
      
      // ���������� �������� ������
      async function performDeleteCatalogGroup(itemId) {
        try {
          const response = await fetch(`/api/catalog/item_delete/modules_groups/${itemId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('������ ������� �������');
          } else {
            alert('������ ������� �������');
          }
          
          // ���������� �� ������ �������� � �������������
          catalogGroupsPagination.currentPage = 1;
          // ��������� ��������, ����� ������ ����� ��������� ���������
          setTimeout(() => {
            loadCatalogGroups();
          }, 300);
        } catch (error) {
          console.error('❌ ������ �������� ������:', error);
          if (typeof toastr !== 'undefined') {
            toastr.error(`������ ��������: ${error.message}`);
          } else {
            alert(`������ ��������: ${error.message}`);
          }
        }
      }
      
      // ���������� �������� ���� ��������
      async function performDeleteCatalogType(itemId) {
        try {
          const response = await fetch(`/api/catalog/item_delete/catalogs_keys/${itemId}`, {
            method: 'DELETE'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          
          const result = await response.json();
          if (typeof toastr !== 'undefined') {
            toastr.success('��� �������� ������� ������');
          } else {
            alert('��� �������� ������� ������');
          }
          
          // ��������� ������ (��� ������������ ������ � ����������� ���������)
          loadCatalogTypes();
        } catch (error) {
          console.error('❌ ������ �������� ���� ��������:', error);
          if (typeof toastr !== 'undefined') {
            toastr.error(`������ ��������: ${error.message}`);
          } else {
            alert(`������ ��������: ${error.message}`);
          }
        }
      }
      
      // ��������� ������ "�����/������" � �������� (�� ���������: URL ��������)
      window.addEventListener('popstate', function(event) {
        const hash = window.location.hash.substring(1); // ������� #
        if (hash) {
          // �������� ��� ��������
          pages.forEach(page => {
            page.classList.remove('active');
          });
          
          // ���������� ������ �������� (��� hash � ? ���� ������ id ��������)
          const pageId = hash.split('?')[0] || hash;
          const targetPage = document.getElementById(pageId) || document.getElementById(hash);
          if (targetPage) {
            targetPage.classList.add('active');
            
            // ��������� ������ ��� ���� ��������
            if (hash === 'clients-orders') {
              loadClientsOrders();
            } else if (hash === 'menu-settings') {
              loadMenuSettings();
            } else if (hash === 'catalog-types') {
              loadCatalogTypes();
            } else if (hash === 'catalog-groups') {
              loadCatalogGroups();
            } else if (hash === 'materials-groups') {
              if (typeof loadMaterialsGroups === 'function') loadMaterialsGroups();
            } else if (hash.startsWith('material-group-edit')) {
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const itemId = parseInt(urlParams.get('id') || '0', 10);
              if (typeof window.openMaterialGroupEdit === 'function') window.openMaterialGroupEdit(itemId);
            } else if (hash.startsWith('catalog-items')) {
              // ������������ �������� ������ ��������� ��������
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const catalogType = urlParams.get('type');
              if (catalogType) {
                // ������� �������� ���� �� ����
                const menuLink = document.querySelector(`a[data-catalog-type="${catalogType}"]`);
                const catalogName = menuLink ? (menuLink.getAttribute('data-catalog-name') || catalogType) : catalogType;
                loadCatalogItems(catalogType, catalogName);
              }
            } else if (hash.startsWith('catalog-item-edit')) {
              // ������������ �������� �������������� �������� ��������
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const catalogType = urlParams.get('type') || '';
              const itemId = parseInt(urlParams.get('id') || '0');
              const catalogName = urlParams.get('name') || '�������';
              if (catalogType) {
                openCatalogItemEdit(itemId, catalogType, catalogName);
              }
            } else if (hash === 'materials-keys') {
              if (typeof window.loadMaterialsKeys === 'function') {
                window.loadMaterialsKeys();
              } else {
                console.error('❌ ������� loadMaterialsKeys �� �������');
              }
            } else if (hash.startsWith('material-key-edit')) {
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const itemId = parseInt(urlParams.get('id') || '0');
              if (typeof window.loadMaterialKeyEdit === 'function') {
                window.loadMaterialKeyEdit(itemId);
              } else {
                console.error('❌ ������� loadMaterialKeyEdit �� �������');
              }
            } else if (hash.startsWith('edges-items')) {
              if (typeof window.loadEdgesItemsFromHash === 'function') window.loadEdgesItemsFromHash();
            } else if (hash.startsWith('edge-item-edit')) {
              const urlParams = new URLSearchParams(hash.split('?')[1] || '');
              const typeKey = urlParams.get('type') || '';
              const itemId = parseInt(urlParams.get('id') || '0', 10);
              if (typeKey && typeof loadEdgeItemEdit === 'function') loadEdgeItemEdit(typeKey, itemId);
            } else if (hash === 'global-vars') {
              if (typeof window.loadGlobalVars === 'function') {
                window.loadGlobalVars();
              } else {
                console.error('❌ ������� loadGlobalVars �� �������');
              }
            }
          }
          
          // ��������� �������� ��������� ���� (��� hash � ? ���������� pageId)
          const menuHash = hash.split('?')[0] || hash;
          document.querySelectorAll('#side-menu > li').forEach(li => {
            li.classList.remove('active');
            const link = li.querySelector('a[data-page="' + menuHash + '"]') || li.querySelector('a[data-page="' + hash + '"]');
            if (link) {
              li.classList.add('active');
            }
          });
        }
      });
      
      // ��������� �������� �� URL ��� ������ �������� (�� ���������: ���� ���� hash � URL)
      const initialHash = window.location.hash.substring(1);
      if (initialHash) {
        const basePageId = initialHash.split('?')[0] || initialHash;
        const targetPage = document.getElementById(basePageId) || document.getElementById(initialHash);
        if (targetPage) {
          // �������� ��� ��������
          pages.forEach(page => {
            page.classList.remove('active');
          });
          // ���������� ������ ��������
          targetPage.classList.add('active');
          
          // ��������� �������� ��������� ����
          document.querySelectorAll('#side-menu > li').forEach(li => {
            li.classList.remove('active');
            const link = li.querySelector('a[data-page="' + basePageId + '"]') || li.querySelector('a[data-page="' + initialHash + '"]');
            if (link) {
              li.classList.add('active');
            }
          });
          
          // ��������� ������
          if (initialHash === 'clients-orders') {
            loadClientsOrders();
          } else if (initialHash === 'menu-settings') {
            loadMenuSettings();
          } else if (initialHash === 'catalog-types') {
            loadCatalogTypes();
          } else if (initialHash === 'catalog-groups') {
            loadCatalogGroups();
          } else if (initialHash === 'materials-groups') {
            if (typeof loadMaterialsGroups === 'function') loadMaterialsGroups();
          } else if (initialHash.startsWith('material-group-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.openMaterialGroupEdit === 'function') window.openMaterialGroupEdit(itemId);
          } else if (initialHash === 'materials-keys') {
            if (typeof window.loadMaterialsKeys === 'function') {
              window.loadMaterialsKeys();
            } else {
              console.error('❌ ������� loadMaterialsKeys �� ������� ��� ��������� ��������');
            }
          } else if (initialHash.startsWith('materials-items')) {
            loadMaterialsItemsFromHash();
          } else if (initialHash.startsWith('material-item-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const typeKey = urlParams.get('type') || '';
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            loadMaterialItemEdit(typeKey, itemId);
          } else if (initialHash === 'edges-keys') {
            if (typeof window.loadEdgesKeys === 'function') window.loadEdgesKeys();
          } else if (initialHash === 'edges-categories' || initialHash.startsWith('edges-categories')) {
            if (typeof window.loadEdgesCategories === 'function') window.loadEdgesCategories();
          } else if (initialHash === 'edges-items' || initialHash.startsWith('edges-items')) {
            if (typeof window.loadEdgesItemsFromHash === 'function') window.loadEdgesItemsFromHash();
          } else if (initialHash === 'facades-items' || initialHash.startsWith('facades-items')) {
            if (typeof window.loadFacades === 'function') window.loadFacades();
          } else if (initialHash === 'models3d-materials') {
            if (typeof window.loadModels3dMaterials === 'function') window.loadModels3dMaterials();
          } else if (initialHash === 'models3d-list') {
            if (typeof window.loadModels3dList === 'function') window.loadModels3dList();
          } else if (initialHash.startsWith('edge-key-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeof window.openEdgeKeyEdit === 'function') window.openEdgeKeyEdit(itemId);
          } else if (initialHash.startsWith('edge-item-edit')) {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const typeKey = urlParams.get('type') || '';
            const itemId = parseInt(urlParams.get('id') || '0', 10);
            if (typeKey && typeof loadEdgeItemEdit === 'function') {
              document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
              const page = document.getElementById('edge-item-edit');
              if (page) { page.classList.add('active'); loadEdgeItemEdit(typeKey, itemId); }
            }
          } else if (initialHash === 'material-key-edit') {
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const itemId = parseInt(urlParams.get('id') || '0');
            if (typeof window.loadMaterialKeyEdit === 'function') {
              window.loadMaterialKeyEdit(itemId);
            } else {
              console.error('❌ ������� loadMaterialKeyEdit �� ������� ��� ��������� ��������');
            }
          } else if (initialHash === 'global-vars') {
            if (typeof window.loadGlobalVars === 'function') {
              window.loadGlobalVars();
            } else {
              console.error('❌ ������� loadGlobalVars �� ������� ��� ��������� ��������');
            }
          } else if (initialHash === 'accessories-library') {
            loadAccessoriesLibrary();
          } else if (initialHash.startsWith('catalog-items')) {
            // ������������ �������� ������ ��������� �������� ��� ������ ��������
            const urlParams = new URLSearchParams(initialHash.split('?')[1] || '');
            const catalogType = urlParams.get('type');
            if (catalogType) {
              const menuLink = document.querySelector(`a[data-catalog-type="${catalogType}"]`);
              const catalogName = menuLink ? (menuLink.getAttribute('data-catalog-name') || catalogType) : catalogType;
              loadCatalogItems(catalogType, catalogName);
            }
          }
        }
      }
      
      // ��������� ������ ��� ������ �������� ��������, ���� ��� �������
      const activePage = document.querySelector('.admin-page.active');
      if (activePage && activePage.id === 'clients-orders') {
        loadClientsOrders();
      }
      
      // ��������� ������ ������ ��� ���� ��� ������������� ��������
      if (typeof window.loadEdgesKeys === 'function') {
        window.loadEdgesKeys().catch(e => console.error('❌ ������ �������� ���� ������:', e));
      }
      
      // ��������� ���� ��� ������ �������� ��������, ���� ��� �������
      if (activePage && activePage.id === 'menu-settings') {
        loadMenuSettings();
      }
      
      // ��������� ���� ��������� ��� ������ �������� ��������, ���� ��� �������
      if (activePage && activePage.id === 'catalog-types') {
        loadCatalogTypes();
      }
      
      // ��������� ������� "������� ���������" ��� ������ �������� ��������
      fetch('/api/catalog/items_get/catalogs_keys')
        .then(response => response.json())
        .then(data => {
          updateCatalogSubmenu(data);
        })
        .catch(error => {
          console.warn('⚠️ �� ������� ��������� ���� ��������� ��� ����:', error);
        });

      // ��������� ������� "������� ���������" ��� ������ �������� ��������
      fetch('/api/catalog/items_get/materials_keys')
        .then(response => response.json())
        .then(data => {
          // ������������ ������ ������� ������ (������ / {items:[]})
          const items = Array.isArray(data) ? data : (Array.isArray(data?.items) ? data.items : []);
          updateMaterialsSubmenu(items);
        })
        .catch(error => {
          console.warn('⚠️ �� ������� ��������� ��������� ��� ����:', error);
        });
      
      // ������������ ��������� ���� ������ PDF
      const pdfPasswordCheckbox = document.getElementById('pdf_password_protection');
      const pdfPasswordRow = document.getElementById('pdf_password_row');
      if (pdfPasswordCheckbox && pdfPasswordRow) {
        pdfPasswordCheckbox.addEventListener('change', function() {
          pdfPasswordRow.style.display = this.checked ? 'flex' : 'none';
        });
      }
      
      // ������������ ��������� ���� ����� ���������
      const reflectionCheckbox = document.getElementById('use_custom_reflection');
      const reflectionFileRow = document.getElementById('reflection_file_row');
      if (reflectionCheckbox && reflectionFileRow) {
        reflectionCheckbox.addEventListener('change', function() {
          reflectionFileRow.style.display = this.checked ? 'flex' : 'none';
        });
      }
      
      // ��������� ���� ��� "��������� ����"
      const modalTriggers = document.querySelectorAll('[data-toggle="modal"]');
      const modals = document.querySelectorAll('.modal');
      const modalCloses = document.querySelectorAll('[data-dismiss="modal"]');
      
      // �������� ��������� ����
      modalTriggers.forEach(trigger => {
        trigger.addEventListener('click', function(e) {
          e.preventDefault();
          const targetId = this.getAttribute('data-target');
          const modal = document.querySelector(targetId);
          if (modal) {
            modal.style.display = 'flex';
          }
        });
      });
      
      // �������� ��������� ����
      modalCloses.forEach(close => {
        close.addEventListener('click', function() {
          const modal = this.closest('.modal');
          if (modal) {
            modal.style.display = 'none';
          }
        });
      });
      
      // �������� �� ����� ��� ���������� ����
      modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
          if (e.target === this) {
            this.style.display = 'none';
          }
        });
      });
      
      // ����������� ��� ������ "��������" � ������� "�������� ���������"
      const componentButtons = document.querySelectorAll('#base_menu_modal .btn-primary.btn-outline');
      
      // ������� �������� ����������� �� �� ��������� (�� ���������)
      const componentMap = {
        '�������': {
          menu_id: 'room_params',
          label: '�������',
          component: { id: 'room_params', props: {} },
          icon: 'icon_sizes'
        },
        '�����������': {
          menu_id: 'constructions',
          label: '�����������',
          component: { id: 'constr_picker', props: { catalog: 'constructions', categories: null } },
          icon: 'icon_construction'
        },
        '������������': {
          menu_id: 'communications',
          label: '������������',
          component: { id: 'model_picker', props: { catalog: 'comms', categories: null } },
          icon: 'icon_comms'
        },
        '�����': {
          menu_id: 'walls_material',
          label: '�����',
          component: { id: 'walls_material_picker', props: { categories: 'materials.walls', selected: 'selected_materials.walls', fn: 'set_walls_material' } },
          icon: 'icon_walls'
        },
        '���': {
          menu_id: 'floor_material',
          label: '���',
          component: { id: 'floor_material_picker', props: { categories: 'materials.floor', selected: 'selected_materials.floor', fn: 'set_floor_material' } },
          icon: 'icon_floor'
        },
        '����������': {
          menu_id: 'global_vars',
          label: '���������� ���������',
          component: { id: 'global_vars', props: {} },
          icon: 'icon_parameters'
        },
        '������': {
          menu_id: 'facades_picker',
          label: '������',
          component: { id: 'facades_picker', props: { facades: 'defaults.facades', materials: 'selected_materials.facades', lib: 'facades' } },
          icon: 'icon_facades'
        },
        '���������� ������': {
          menu_id: 'showcase_filling',
          label: '���������� ������',
          component: { id: 'model_picker', props: { catalog: 'showcase', categories: null } },
          icon: 'icon_showcase'
        },
        '������ ����������': {
          menu_id: 'corpus_material_picker',
          label: '������ ����������',
          component: { id: 'corpus_material_picker', props: { mode: 'p', categories: 'materials.top.corpus', selected: 'selected_materials.top.corpus', lib: 'materials', fn: 'set_corpus_material' } },
          icon: 'icon_materials'
        },
        '��������� �������': {
          menu_id: 'materials_models',
          label: '��������� �������',
          component: { id: 'materials_picker', props: {} },
          icon: 'icon_materials'
        },
        '������': {
          menu_id: 'cokol_material_picker',
          label: '������',
          component: { id: 'cokol_material_picker', props: { categories: 'materials.cokol', selected: 'selected_materials.cokol', fn: 'set_cokol_material' } },
          icon: 'icon_cokol'
        },
        '����������': {
          menu_id: 'tabletop_picker',
          label: '����������',
          component: { id: 'tabletop_picker', props: { categories: '', selected: 'defaults.tabletop', fn: 'set_tabletop' } },
          icon: 'icon_tabletop'
        },
        '������� �������': {
          menu_id: 'module_picker',
          label: '������� �������',
          component: { id: 'module_picker_v2', props: { catalog: 'catalog', categories: ['module'], hide_variants: false } },
          icon: 'icon_catalog'
        },
        '�����': {
          menu_id: 'handles_picker',
          label: '�����',
          component: { id: 'handles_picker', props: {} },
          icon: 'icon_furniture_handle'
        },
        '�����': {
          menu_id: 'washes_picker',
          label: '�����',
          component: { id: 'washes_picker', props: {} },
          icon: 'icon_sink'
        },
        '�������': {
          menu_id: 'tech_picker',
          label: '�������',
          component: { id: 'model_picker', props: { catalog: 'tech', categories: null } },
          icon: 'icon_technic'
        },
        '��������': {
          menu_id: 'interior_picker',
          label: '��������',
          component: { id: 'model_picker', props: { catalog: 'interior', categories: null } },
          icon: 'icon_interior'
        },
        '�������': {
          menu_id: 'project_picker',
          label: '�������',
          component: { id: 'project_picker', props: {} },
          icon: 'icon_your_project'
        },
        '�������������': {
          menu_id: 'accessories_component',
          label: '�������������',
          component: { id: 'accessories_component', props: {} },
          icon: 'icon_basket'
        },
        '���������': {
          menu_id: 'module_type_picker',
          label: '���������',
          component: { id: 'module_type_picker', props: { types: null } },
          icon: 'icon_furnitura'
        }
      };
      
      componentButtons.forEach(button => {
        button.addEventListener('click', function(e) {
          e.preventDefault();
          e.stopPropagation();
          
          // �������� �������� ���������� �� ������ � ������ �������
          const row = this.closest('tr');
          const componentName = row.querySelector('span').textContent.trim();
          // �������� ��������� ����������
          const componentData = componentMap[componentName];
          
          if (!componentData) {
            alert(`��������� "${componentName}" �� ������ � ��������.`);
            console.error('❌ ��������� �� ������:', componentName);
            return;
          }
          
          // ����������, ��� currentMenuData ���������������
          if (!currentMenuData) {
            currentMenuData = {
              main_menu: [],
              top_menu_left: [],
              top_menu_right: []
            };
          }
          
          if (!currentMenuData.main_menu) {
            currentMenuData.main_menu = [];
          }
          
          // ���������� ���������� menu_id ���� �����
          let menuId = componentData.menu_id;
          if (currentMenuData.main_menu.some(item => (item.menu_id || item.id) === menuId)) {
            menuId = componentData.menu_id + '_' + Date.now();
          }
          
          // ������� ����� ������� ����
          const newMenuItem = {
            menu_id: menuId,
            label: componentData.label,
            component: componentData.component,
            children: [],
            list_view: false
          };
          
          if (componentData.icon) {
            newMenuItem.icon = componentData.icon;
          }
          
          // ��������� � main_menu
          currentMenuData.main_menu.push(newMenuItem);
          
          // ��������� � ������ ���� ���������
          const container = document.querySelector('#menu-settings .pp-tree-slicklist');
          if (container) {
            renderMenuItem(container, newMenuItem, 0);
          }
          
          // ��������� �������
          const modal = document.getElementById('base_menu_modal');
          if (modal) {
            modal.style.display = 'none';
          }
        });
      });
    });
