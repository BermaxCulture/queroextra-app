import * as React from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar, Clock } from 'lucide-react'
import { ZapGradient } from '../icons/ZapGradient'
import type { JobCardProps } from './JobCard.types'
import { Button } from '../Button'
import { Badge } from '../Badge'

export const JobCard: React.FC<JobCardProps> = ({
  category,
  title,
  location,
  distance,
  date,
  time,
  value,
  unit = '/turno',
  isUrgent = false,
  tags = [],
  onApply,
}) => (
  <motion.article
    className={[
      'bg-qe-white rounded-qe-md border border-qe-gray-200 overflow-hidden cursor-pointer',
      isUrgent ? 'border-t-[3px] border-t-qe-error' : '',
    ].join(' ')}
    whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
    transition={{ duration: 0.15 }}
  >
    <div className="p-4">
      <div className="flex justify-between items-start mb-2.5">
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] font-bold tracking-[0.8px] uppercase text-qe-gray-500">
            {category}
          </span>
          {isUrgent && <Badge variant="urgent">Urgente</Badge>}
        </div>
        <div className="text-right flex-shrink-0 ml-2">
          <div className="text-[20px] font-bold text-qe-gray-900 leading-none">
            R$ {value.toLocaleString('pt-BR')}
          </div>
          <div className="text-[11px] text-qe-gray-400 font-normal">{unit}</div>
        </div>
      </div>

      <h3 className="text-[17px] font-bold text-qe-gray-900 mb-2.5 leading-[1.3]">{title}</h3>

      <div className="flex flex-col gap-1 mb-3">
        <div className="flex items-center gap-1.5 text-[13px] text-qe-gray-500">
          <MapPin size={14} className="text-qe-gray-400 flex-shrink-0" aria-hidden="true" />
          <span>{location}{distance ? ` · ${distance}` : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-qe-gray-500">
          <Calendar size={14} className="text-qe-gray-400 flex-shrink-0" aria-hidden="true" />
          <span>{date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-[13px] text-qe-gray-500">
          <Clock size={14} className="text-qe-gray-400 flex-shrink-0" aria-hidden="true" />
          <span>{time}</span>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {tags.map((tag) => (
            <Badge key={tag} variant="category">{tag}</Badge>
          ))}
        </div>
      )}
    </div>

    <div className="border-t border-qe-gray-100 px-4 pt-3 pb-4">
      <Button variant="primary" size="lg" onClick={onApply}>
        QUERO EXTRA <ZapGradient size={16} />
      </Button>
    </div>
  </motion.article>
)
