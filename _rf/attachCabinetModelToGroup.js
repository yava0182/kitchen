function attachCabinetModelToGroup(opts) {
    const contentGroup = opts?.contentGroup;
    const placeholderMesh = opts?.placeholderMesh;
    const nodeSpec = opts?.spec && typeof opts.spec === 'object' ? opts.spec : {};
    const sizeMm = opts?.sizeMm || { x: 70, y: 100, z: 70 };
    const buildEpoch = Number(opts?.buildEpoch) || 0;
    const parentGroup = opts?.parentGroup;

    if (!contentGroup) return;

    const isStale = () =>
      !contentGroup.parent ||
      (parentGroup && parentGroup.userData && Number(parentGroup.userData._cldModelEpoch) !== buildEpoch);

    ensureCabinetModelLibraryMap().then((map) => {
      if (isStale()) return;
      const id = nodeSpec.id != null ? String(nodeSpec.id).trim() : '';
      let mergedSpec = { ...nodeSpec };
      if (id && map && map[id] && map[id].params) {
        mergedSpec = shallowMergeParams(map[id].params, nodeSpec);
        mergedSpec.id = id;
      }
      const entry = pickCabinetModelVariant(mergedSpec, sizeMm);
      const urlRaw = entry?.model || mergedSpec.modelUrl || mergedSpec.model || '';
      const url = resolveAssetUrl(String(urlRaw || '').trim());
      if (!url) {
        hideHingeCatalogPlaceholder(placeholderMesh, parentGroup);
        return;
      }

      loadAssetRootOnce(url).then((tpl) => {
        if (isStale()) return;
        if (!tpl) {
          hideHingeCatalogPlaceholder(placeholderMesh, parentGroup);
          return;
        }
        const root = prepareCabinetModelRoot(tpl, mergedSpec, entry, sizeMm, {
          pivot: opts?.pivot || null,
        });
        return applyRoomCabinetModelMaterials(root, mergedSpec, entry).catch((err) => {
          try {
            console.warn('[CLD] cabinet model materials failed', err);
          } catch (_) {}
        }).then(() => {
          if (isStale()) return;
          if (parentGroup && root.userData?.cldCabinetMaterialParams) {
            stampCatalogMaterialOnNode(
              parentGroup,
              root.userData.cldCabinetMaterialToken,
              root.userData.cldCabinetMaterialParams,
            );
            const mid = String(mergedSpec?.id ?? parentGroup.userData?.modelSpecId ?? '').trim();
            if (mid === '5' || mid === '6') {
              parentGroup.userData.cldHingeCatalogModel = true;
              parentGroup.userData.isHingeCabinetModelMetal = true;
              try {
                root.traverse((o) => {
                  if (!o) return;
                  o.userData = o.userData || {};
                  o.userData.cldHingeCatalogModel = true;
                  o.userData.isHingeCabinetModelMetal = true;
                  if (mid) o.userData.modelSpecId = mid;
                });
              } catch (_) {}
            }
          }
          if (placeholderMesh && placeholderMesh.parent) {
            placeholderMesh.parent.remove(placeholderMesh);
            if (placeholderMesh.geometry) placeholderMesh.geometry.dispose();
            if (placeholderMesh.material) placeholderMesh.material.dispose();
          }
          contentGroup.add(root);
          // Прокинуть метки стыкового крепежа с parent model-group → GLB (для «Контуры»).
          try {
            const pud = parentGroup?.userData || {};
            if (
              pud.fromJointScheme ||
              Number(pud.jointTemplateModel) === 1 ||
              Number(pud.joint_hardware) === 1 ||
              Number(mergedSpec?.joint_template_model) === 1 ||
              Number(mergedSpec?.joint_hardware) === 1
            ) {
              root.userData = root.userData || {};
              root.userData.fromJointScheme = 1;
              root.userData.jointHardwareMesh = true;
              root.userData.isAccessory = true;
              root.traverse((o) => {
                if (!o?.userData) return;
                o.userData.fromJointScheme = 1;
                o.userData.jointHardwareMesh = true;
                o.userData.isAccessory = true;
              });
              if (typeof window !== 'undefined' && typeof window.__cldRefreshRoomFurnitureXray === 'function') {
                window.__cldRefreshRoomFurnitureXray();
              }
            }
          } catch (_) {}
          return spawnRodCompanionsForRoomAttach({
            contentGroup,
            root,
            mergedSpec,
            entry,
            sizeMm,
            buildEpoch,
            isStale,
          }).then((spawned) => {
            if (isStale()) return;
            if (spawned > 0 && typeof window !== 'undefined' && window.__CLD_DEBUG_PLACE === true) {
              console.warn('[CLD][ROD] плечики в комнате', { modelId: id, spawned });
            }
            const rebindRoot = (function findFurnitureRoot(obj) {
              let p = parentGroup || contentGroup;
              for (let i = 0; i < 32 && p; i++) {
                if (p.isGroup && p.userData?.isFurniture) return p;
                p = p.parent;
              }
              return parentGroup || contentGroup;
            })();
            try {
              if (typeof window.__cldSnapNicheFurnitureRoot === 'function') {
                window.__cldSnapNicheFurnitureRoot(rebindRoot);
              }
            } catch (_) {}
            try {
              // Только coalesce на этот шкаф — не SyncAll по всей комнате
              if (typeof window.__cldScheduleCabinetStudioRebind === 'function') {
                window.__cldScheduleCabinetStudioRebind(rebindRoot);
              } else if (typeof window.__cldApplyRoomCabinetStudioLook === 'function') {
                window.__cldApplyRoomCabinetStudioLook(rebindRoot);
              }
            } catch (_) {}
            if (
              parentGroup?.userData?.cldHingeCatalogModel &&
              (String(parentGroup.userData.modelSpecId || '').trim() === '5' ||
                String(parentGroup.userData.modelSpecId || '').trim() === '6') &&
              typeof global.ClodisBuilder?.refinalizeHingeAfterCatalogModelLoaded === 'function'
            ) {
              const pg = parentGroup;
              requestAnimationFrame(() => {
                if (!pg.parent) return;
                global.ClodisBuilder.refinalizeHingeAfterCatalogModelLoaded(pg);
                try {
                  if (typeof window.__cldSnapNicheFurnitureRoot === 'function') {
                    window.__cldSnapNicheFurnitureRoot(pg);
                  }
                } catch (_) {}
                try {
                  if (typeof window.__cldScheduleCabinetStudioRebind === 'function') {
                    window.__cldScheduleCabinetStudioRebind(pg);
                  } else if (typeof window.__cldApplyRoomCabinetStudioLook === 'function') {
                    const furnitureRoot = (function findFurnitureRoot(obj) {
                      let p = obj;
                      for (let i = 0; i < 32 && p; i++) {
                        if (p.isGroup && p.userData?.isFurniture) return p;
                        p = p.parent;
                      }
                      return obj;
                    })(pg);
                    window.__cldApplyRoomCabinetStudioLook(furnitureRoot);
                  }
                } catch (_) {}
              });
            }
          });
        });
      });
    });
  }