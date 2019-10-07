/**
 * Copyright (c) 2019 mol* contributors, licensed under MIT, See LICENSE file for more info.
 *
 * @author Alexander Rose <alexander.rose@weirdbyte.de>
 */

import { StructureProperties, StructureElement, Link, Model } from '../../mol-model/structure';
import { Color } from '../../mol-util/color';
import { Location } from '../../mol-model/location';
import { ColorTheme, LocationColor } from '../color';
import { ParamDefinition as PD } from '../../mol-util/param-definition'
import { ThemeDataContext } from '../../mol-theme/theme';
import { Table, Column } from '../../mol-data/db';
import { mmCIF_Schema } from '../../mol-io/reader/cif/schema/mmcif';
import { getPaletteParams, getPalette } from '../../mol-util/color/palette';
import { TableLegend, ScaleLegend } from '../../mol-util/legend';

const DefaultColor = Color(0xFAFAFA)
const Description = 'Gives ranges of a polymer chain a color based on the entity source it originates from. Genes get the same color per entity.'

export const EntitySourceColorThemeParams = {
    ...getPaletteParams({ type: 'set', setList: 'set-3' }),
}
export type EntitySourceColorThemeParams = typeof EntitySourceColorThemeParams
export function getEntitySourceColorThemeParams(ctx: ThemeDataContext) {
    const params = PD.clone(EntitySourceColorThemeParams)
    if (ctx.structure) {
        if (getMaps(ctx.structure.root.models).srcKeySerialMap.size > 12) {
            params.palette.defaultValue.name = 'scale'
            params.palette.defaultValue.params = {
                ...params.palette.defaultValue.params,
                list: 'red-yellow-blue'
            }
        }
    }
    return params
}

function modelEntityKey(modelIndex: number, entityId: string) {
    return `${modelIndex}|${entityId}`
}

type EntitySrc = Table<{
    entity_id: mmCIF_Schema['entity_src_gen']['entity_id'],
    pdbx_src_id: mmCIF_Schema['entity_src_gen']['pdbx_src_id'],
    pdbx_beg_seq_num: mmCIF_Schema['entity_src_gen']['pdbx_beg_seq_num'],
    pdbx_end_seq_num: mmCIF_Schema['entity_src_gen']['pdbx_end_seq_num'],
}>
type GeneSrcGene = Column<mmCIF_Schema['entity_src_gen']['pdbx_gene_src_gene']['T']>

function srcKey(modelIndex: number, entityId: string, srcId: number, gene: string) {
    return `${modelIndex}|${entityId}|${gene ? gene : srcId}`
}

function addSrc(seqToSrcByModelEntity: Map<string, Int16Array>, srcKeySerialMap: Map<string, number>, modelIndex: number, model: Model, entity_src: EntitySrc, gene_src_gene?: GeneSrcGene) {
    const { entity_id, pdbx_src_id, pdbx_beg_seq_num, pdbx_end_seq_num } = entity_src
    for (let j = 0, jl = entity_src._rowCount; j < jl; ++j) {
        const entityId = entity_id.value(j)
        const mK = modelEntityKey(modelIndex, entityId)
        let seqToSrc: Int16Array
        if (!seqToSrcByModelEntity.has(mK)) {
            const entityIndex = model.entities.getEntityIndex(entityId)
            const seq = model.sequence.sequences[entityIndex].sequence
            seqToSrc = new Int16Array(seq.length)
            seqToSrcByModelEntity.set(mK, seqToSrc)
        } else {
            seqToSrc = seqToSrcByModelEntity.get(mK)!
        }
        const sK = srcKey(modelIndex, entityId, pdbx_src_id.value(j), gene_src_gene ? gene_src_gene.value(j).join(',') : '')

        // may not be given (= 0) indicating src is for the whole seq
        const beg = pdbx_beg_seq_num.valueKind(j) === Column.ValueKind.Present ? pdbx_beg_seq_num.value(j) : 1
        const end = pdbx_end_seq_num.valueKind(j) === Column.ValueKind.Present ? pdbx_end_seq_num.value(j) : seqToSrc.length

        let srcIndex: number // serial no starting from 1
        if (srcKeySerialMap.has(sK)) {
            srcIndex = srcKeySerialMap.get(sK)!
        } else {
            srcIndex = srcKeySerialMap.size + 1
            srcKeySerialMap.set(sK, srcIndex)
        }
        // set src index
        for (let i = beg, il = end; i <= il; ++i) {
            seqToSrc[i - 1] = srcIndex
        }
    }
}

function getMaps(models: ReadonlyArray<Model>) {
    const seqToSrcByModelEntity = new Map<string, Int16Array>()
    const srcKeySerialMap = new Map<string, number>() // serial no starting from 1

    for (let i = 0, il = models.length; i <il; ++i) {
        const m = models[i]
        if (m.sourceData.kind !== 'mmCIF') continue
        const { entity_src_gen, entity_src_nat, pdbx_entity_src_syn } = m.sourceData.data
        addSrc(seqToSrcByModelEntity, srcKeySerialMap, i, m, entity_src_gen, entity_src_gen.pdbx_gene_src_gene)
        addSrc(seqToSrcByModelEntity, srcKeySerialMap, i, m, entity_src_nat)
        addSrc(seqToSrcByModelEntity, srcKeySerialMap, i, m, pdbx_entity_src_syn)
    }

    return { seqToSrcByModelEntity, srcKeySerialMap }
}

export function EntitySourceColorTheme(ctx: ThemeDataContext, props: PD.Values<EntitySourceColorThemeParams>): ColorTheme<EntitySourceColorThemeParams> {
    let color: LocationColor
    let legend: ScaleLegend | TableLegend | undefined

    if (ctx.structure) {
        const l = StructureElement.Location.create()
        const { models } = ctx.structure.root
        const { seqToSrcByModelEntity, srcKeySerialMap } = getMaps(models)

        const labelTable = Array.from(srcKeySerialMap.keys()).map(v => {
            const l = v.split('|')[2]
            return l === '1' ? 'Unnamed' : l
        })
        labelTable.push('Unknown')
        props.palette.params.valueLabel = (i: number) => labelTable[i]

        const palette = getPalette(srcKeySerialMap.size + 1, props)
        legend = palette.legend

        const getSrcColor = (location: StructureElement.Location) => {
            const modelIndex = models.indexOf(location.unit.model)
            const entityId = StructureProperties.entity.id(location)
            const mK = modelEntityKey(modelIndex, entityId)
            const seqToSrc = seqToSrcByModelEntity.get(mK)
            if (seqToSrc) {
                // minus 1 to convert seqId to array index
                return palette.color(seqToSrc[StructureProperties.residue.label_seq_id(location) - 1])
            } else {
                return DefaultColor
            }
        }

        color = (location: Location): Color => {
            if (StructureElement.Location.is(location)) {
                return getSrcColor(location)
            } else if (Link.isLocation(location)) {
                l.unit = location.aUnit
                l.element = location.aUnit.elements[location.aIndex]
                return getSrcColor(l)
            }
            return DefaultColor
        }
    } else {
        color = () => DefaultColor
    }

    return {
        factory: EntitySourceColorTheme,
        granularity: 'group',
        color,
        props,
        description: Description,
        legend
    }
}

export const EntitySourceColorThemeProvider: ColorTheme.Provider<EntitySourceColorThemeParams> = {
    label: 'Entity Source',
    factory: EntitySourceColorTheme,
    getParams: getEntitySourceColorThemeParams,
    defaultValues: PD.getDefaultValues(EntitySourceColorThemeParams),
    isApplicable: (ctx: ThemeDataContext) => !!ctx.structure
}